# Aircall IVR - Sistema de Enrutamiento Inteligente

Sistema de enrutamiento de llamadas entrantes de Aircall basado en contactos de HubSpot. Este servicio webhook recibe llamadas de Aircall, busca el contacto correspondiente en HubSpot mediante el número de teléfono, y enruta la llamada al agente asignado al contacto.

## 📋 Descripción del Proyecto

Este proyecto implementa un sistema de enrutamiento inteligente de llamadas que:

1. **Recibe webhooks de Aircall**: El servicio escucha las llamadas entrantes desde Aircall
2. **Busca contactos en HubSpot**: Utiliza el número de teléfono entrante para buscar el contacto correspondiente en HubSpot
3. **Enruta a agentes específicos**: Si encuentra un contacto, enruta la llamada al agente asignado (propietario) en HubSpot
4. **Sistema de fallback**: Si no encuentra el contacto o hay errores, enruta a una secuencia de fallback predefinida

### Flujo de Funcionamiento

```
Llamada Entrante (Aircall)
    ↓
Webhook POST /aircall-routing
    ↓
Verificación de Firma (Seguridad)
    ↓
Búsqueda en HubSpot por Número de Teléfono
    ↓
¿Contacto encontrado?
    ├─ SÍ → Enrutar al agente asignado
    └─ NO → Enrutar a secuencia de fallback
```

### Secuencia de Fallback

Si no se encuentra un contacto o hay un error:
1. **Primer intento**: Oscar (+34664413035)
2. **Segundo intento**: Erica (+34674149055)

## 🚀 Implementación con Docker

### Prerrequisitos

- Docker instalado ([Descargar Docker](https://www.docker.com/get-started))
- Docker Compose instalado (incluido en Docker Desktop)
- Credenciales de HubSpot API
- Secreto del webhook de Aircall

### Paso 1: Configurar Variables de Entorno

1. Copia el archivo de ejemplo de variables de entorno:
```bash
cp env.example .env
```

2. Edita el archivo `.env` y completa las siguientes variables:

```env
PORT=3000
HUBSPOT_API_KEY=tu_hubspot_api_key_aqui
AIRCALL_WEBHOOK_SECRET=tu_aircall_webhook_secret_aqui
```

#### Obtener Credenciales

**HubSpot API Key:**
1. Ve a [HubSpot Settings](https://app.hubspot.com/settings/integrations/private-apps)
2. Crea una nueva Private App
3. Asigna los permisos necesarios (lectura de contactos)
4. Copia la API Key generada

**Aircall Webhook Secret:**
1. Ve a la configuración de tu aplicación Aircall
2. Configura el webhook con la URL de tu servidor
3. Copia el secreto del webhook para verificación de firmas

### Paso 2: Construir y Ejecutar con Docker Compose

```bash
# Construir y levantar el contenedor
docker-compose up -d

# Ver los logs
docker-compose logs -f

# Detener el contenedor
docker-compose down
```

### Paso 2 (Alternativa): Desplegar con Portainer

Si estás usando Portainer para gestionar tus contenedores:

1. **Crea un nuevo Stack** en Portainer
2. **Copia el contenido** de `docker-compose.yml`
3. **Configura las variables de entorno** en la sección "Environment variables" de Portainer:
   - `PORT=3000` (opcional, por defecto es 3000)
   - `HUBSPOT_API_KEY=tu_hubspot_api_key_aqui`
   - `AIRCALL_WEBHOOK_SECRET=tu_aircall_webhook_secret_aqui`
4. **Despliega el stack**

**Nota**: El `docker-compose.yml` ya no requiere un archivo `.env` físico, las variables se configuran directamente en Portainer.

### Paso 3: Construir y Ejecutar con Docker (sin Compose)

```bash
# Construir la imagen
docker build -t aircall-ivr .

# Ejecutar el contenedor
docker run -d \
  --name aircall-ivr \
  -p 3000:3000 \
  --env-file .env \
  aircall-ivr

# Ver los logs
docker logs -f aircall-ivr

# Detener el contenedor
docker stop aircall-ivr
docker rm aircall-ivr
```

## 🔧 Configuración en Aircall

1. Ve a la configuración de tu cuenta Aircall
2. Configura un webhook con la siguiente URL:
   ```
   https://tu-dominio.com/aircall-routing
   ```
3. Configura el secreto del webhook en la variable `AIRCALL_WEBHOOK_SECRET`
4. Asegúrate de que el webhook esté configurado para recibir eventos de llamadas entrantes

## 📝 Mapeo de Usuarios

El sistema incluye un mapeo de IDs de propietarios de HubSpot a IDs de usuarios de Aircall. Este mapeo se encuentra en el archivo `server.js`:

```javascript
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
};
```

**Nota**: Debes actualizar este mapeo con los IDs reales de tus usuarios en HubSpot y Aircall.

## 🔒 Seguridad

El sistema implementa verificación de firmas HMAC SHA-256 para validar que los webhooks provienen realmente de Aircall. Si `AIRCALL_WEBHOOK_SECRET` no está configurado, el sistema mostrará una advertencia pero continuará funcionando (no recomendado para producción).

## 📊 Endpoints

### POST /aircall-routing

Endpoint principal que recibe los webhooks de Aircall.

**Headers requeridos:**
- `x-aircall-signature`: Firma HMAC del webhook (si está configurado el secreto)

**Body esperado:**
```json
{
  "incoming_number": "+34612345678"
}
```

**Respuesta exitosa:**
```json
{
  "actions": [
    {
      "action": "transfer",
      "to": [
        {
          "type": "user",
          "id": "32443941"
        },
        {
          "type": "phone_number",
          "number": "+34664413035"
        },
        {
          "type": "phone_number",
          "number": "+34674149055"
        }
      ]
    }
  ]
}
```

## 🛠️ Desarrollo Local (sin Docker)

Si prefieres ejecutar el proyecto sin Docker:

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 📦 Estructura del Proyecto

```
aircall-ivr/
├── server.js              # Servidor principal
├── package.json           # Dependencias del proyecto
├── Dockerfile             # Configuración de Docker
├── docker-compose.yml     # Configuración de Docker Compose
├── .dockerignore          # Archivos a ignorar en Docker
├── .env.example           # Plantilla de variables de entorno
└── README.md              # Esta documentación
```

## 🐛 Solución de Problemas

### El contenedor no inicia

- Verifica que el puerto 3000 no esté en uso
- Revisa los logs: `docker-compose logs`
- Verifica que el archivo `.env` esté configurado correctamente

### Webhooks no funcionan

- Verifica que la URL del webhook en Aircall sea accesible públicamente
- Revisa que `AIRCALL_WEBHOOK_SECRET` esté configurado correctamente
- Verifica los logs del servidor para ver errores de verificación de firma

### No se encuentran contactos en HubSpot

- Verifica que `HUBSPOT_API_KEY` sea válida
- Asegúrate de que la API key tenga permisos de lectura de contactos
- Revisa que el formato del número de teléfono sea correcto

## 📄 Licencia

ISC

## 👥 Contribuciones

Para contribuir al proyecto, por favor:
1. Crea un fork del repositorio
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Envía un pull request

---

**Nota**: Asegúrate de mantener seguras tus credenciales y nunca las subas al repositorio. El archivo `.env` está incluido en `.dockerignore` y `.gitignore` para proteger tus secretos.

