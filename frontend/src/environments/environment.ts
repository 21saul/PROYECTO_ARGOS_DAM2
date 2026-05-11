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

  // URL BASE DEL BACKEND CODEIGNITER 4 SERVIDO POR DDEV EN LOCAL
  apiBaseUrl: 'https://argos.ddev.site/api/v1',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
