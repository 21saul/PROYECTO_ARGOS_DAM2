// ENVIRONMENT (DESARROLLO)
//
// RESUMEN: VARIABLES DE ENTORNO PARA EL BUILD DE DESARROLLO DEL
// FRONTEND IONIC. EXPONE LA URL BASE DEL BACKEND ARGOS QUE
// CONSUME EL ApiService.
//
// NOTA: ANGULAR REEMPLAZA ESTE ARCHIVO POR environment.prod.ts
// EN BUILDS DE PRODUCCION (CONFIGURADO EN angular.json).

export const environment = {
  // FLAG DE PRODUCCION DESACTIVADO EN DESARROLLO
  production: false,

  // URL BASE DEL BACKEND - RELATIVA AL MISMO ORIGEN DEL DEV SERVER
  // EL DEV SERVER PROXEA /api → http://127.0.0.1:8080 (proxy.conf.json)
  // ASI EL MOVIL SOLO NECESITA EL PUERTO 8100 ABIERTO EN EL FIREWALL
  // Y SE EVITA EL CORS PORQUE TODO VIENE DEL MISMO ORIGIN
  apiBaseUrl: '/api/v1',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
