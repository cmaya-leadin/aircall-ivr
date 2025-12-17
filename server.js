require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Claves de API y Secreto
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
const AIRCALL_WEBHOOK_SECRET = process.env.AIRCALL_WEBHOOK_SECRET;


const verifyAircallSignature = (req, res, next) => {
    if (!AIRCALL_WEBHOOK_SECRET) {
        console.warn('ADVERTENCIA: AIRCALL_WEBHOOK_SECRET no está configurado. La verificación de seguridad está deshabilitada.');
        return next();
    }

    const signature = req.headers['x-aircall-signature'];
    if (!signature) {
        console.error('Firma de Aircall no encontrada en los encabezados.');
        return res.status(401).send('No autorizado: Firma no proporcionada.');
    }

    const hmac = crypto.createHmac('sha256', AIRCALL_WEBHOOK_SECRET);
    hmac.update(req.rawBody);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
        console.error('Firma de Aircall inválida. Acceso denegado.');
        return res.status(401).send('No autorizado: Firma inválida.');
    }

    console.log('Verificación de firma de Aircall exitosa.');
    next();
};


app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString(); 
    }
}));
app.use(express.urlencoded({ extended: true }));


const cleanPhoneNumber = (number) => {
    if (!number) return null;
    return number.replace(/[^\d+]/g, '');
};

app.post('/aircall-routing', verifyAircallSignature, async (req, res) => {
    

    const { incoming_number } = req.body; 
    const phoneNumber = cleanPhoneNumber(incoming_number);

    if (!phoneNumber) {
        console.error('Número de teléfono entrante no válido o ausente.');
        // Si el número es inválido, enrutamos directamente al fallback (Oscar)
        return handleFallbackRouting(res); 
    }

    let ownerId = null;

    try {

        const searchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
        const searchPayload = {
            "filterGroups": [{
                "filters": [
                    { "propertyName": "phone", "operator": "EQ", "value": phoneNumber },
                    { "propertyName": "mobilephone", "operator": "EQ", "value": phoneNumber }
                ]
            }],
            "properties": ["hubspot_owner_id"], 
            "limit": 1
        };

        const hubspotResponse = await axios.post(searchUrl, searchPayload, {
            headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}`, 'Content-Type': 'application/json' }
        });

        if (hubspotResponse.data.results.length > 0) {
            ownerId = hubspotResponse.data.results[0].properties.hubspot_owner_id;
            console.log(`Contacto encontrado. Propietario ID: ${ownerId}`);
        } else {
            console.log(`No se encontró contacto para el número ${phoneNumber}.`);
        }

    } catch (error) {
        console.error('Error al consultar HubSpot:', error.response ? error.response.data : error.message);

        return handleFallbackRouting(res); 
    }


    const destinations = [];
    

    if (ownerId) {
        // **!!! IMPORTANTE: MAPEO DE ID's !!!**
        const ownerMap = {
            '868950': '32443941', // Erica
            '638082': '32094151', // Oscar
            '1739501': '582374577', // Joan 
            '1740316': '76535741', // Laura Navarro
            '1739504': '587085610', // Marc
            '1739508': '', // Pol
            '1739511': '79861974', // Raquel
            '1580388': '379468330', // Xavi
            '804330': '33971907', // Carlos            
            // Hay Clara y Mireia (83437873 y 83174610) Pero no tienen aircall y Pol no tiene user en hubspot 
            // Agrega aquí los mapeos reales de tus usuarios
        };
        
        const aircallUserId = ownerMap[ownerId];
        
        if (aircallUserId) {
            console.log(`Enrutando al Propietario mapeado (Aircall User ID: ${aircallUserId}).`);
            destinations.push({
                type: 'user', 
                id: aircallUserId 
            });
        }
    }
    

    if (destinations.length === 0) {
        console.log('No se encontró propietario o mapeo. Usando la secuencia de fallback (Oscar -> Erica).');
    }
    

    destinations.push(
        { // 1er Fallback: Oscar
            type: 'phone_number',
            number: '+34664413035' // Oscar
        },
        { // 2do Fallback: Erica
            type: 'phone_number',
            number: '+34674149055' // Erica
        }
    );
    
    // 4. Responder a Aircall
    const aircallResponse = {
        actions: [
            {
                action: 'transfer', 
                to: destinations
            }
        ]
    };
    
    res.json(aircallResponse);
});


function handleFallbackRouting(res) {
    const fallbackResponse = {
        actions: [
            {
                action: 'transfer', 
                to: [
                    { type: 'phone_number', number: '+34664413035' }, // Oscar
                    { type: 'phone_number', number: '+34674149055' }  // Erica
                ]
            }
        ]
    };
    console.log('Error crítico/número inválido. Enrutando directamente a la secuencia de Fallback.');
    res.json(fallbackResponse);
}

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});