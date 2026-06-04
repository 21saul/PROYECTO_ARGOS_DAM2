// IMPORTACION DEL ESQUEMA QUE PERMITE WEB COMPONENTS, DEL DECORADOR NGMODULE
// Y DEL TOKEN LOCALE_ID PARA FIJAR EL IDIOMA POR DEFECTO DE LOS PIPES
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, LOCALE_ID } from '@angular/core';
// UTILIDAD PARA REGISTRAR LOS DATOS DE UN LOCALE EN TIEMPO DE EJECUCION
import { registerLocaleData } from '@angular/common';
// DATOS DEL LOCALE ESPAÑOL — IMPRESCINDIBLES PARA QUE EL PIPE number:'…':'es'
// FUNCIONE SIN LANZAR NG0701 "Missing locale data for the locale 'es'"
import localeEs from '@angular/common/locales/es';

// REGISTRO DEL LOCALE ESPAÑOL ANTES DE QUE ARRANQUE EL MODULO RAIZ
registerLocaleData(localeEs, 'es');
// IMPORTACION DEL MODULO BASE DEL NAVEGADOR — IMPRESCINDIBLE EN APLICACIONES BROWSER
import { BrowserModule } from '@angular/platform-browser';
// IMPORTACION DE LA INTERFAZ DE ESTRATEGIA DE REUTILIZACION DE RUTAS
import { RouteReuseStrategy } from '@angular/router';
// IMPORTACION DEL HTTPCLIENTMODULE NECESARIO PARA EL APISERVICE
import { HttpClientModule } from '@angular/common/http';

// IMPORTACION DEL MODULO DE IONIC Y SU ESTRATEGIA DE RUTAS NATIVAS
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// IMPORTACION DEL COMPONENTE RAIZ DE LA APLICACION ARGOS
import { AppComponent } from './app.component';
// IMPORTACION DEL MODULO DE RUTAS DE PRIMER NIVEL
import { AppRoutingModule } from './app-routing.module';
// COMPONENTE STANDALONE DEL OJO FLOTANTE COMPAÑERO ARGUS — VISIBLE EN TODA LA APP
import { ArgusEyeComponent } from './shared/components/argus-eye/argus-eye.component';

// METADATOS DEL MODULO RAIZ DE ARGOS — DECLARA EL APP COMPONENT Y CONFIGURA IONIC
@NgModule({
  // DECLARACIONES DE COMPONENTES NO STANDALONE GESTIONADOS POR ESTE MODULO
  declarations: [AppComponent],
  // IMPORTACIONES NECESARIAS PARA QUE LA APP ARRANQUE Y RENDERICE CORRECTAMENTE
  imports: [BrowserModule, HttpClientModule, IonicModule.forRoot(), AppRoutingModule, ArgusEyeComponent],
  // PROVIDERS — SUSTITUYE LA ESTRATEGIA DE RUTAS POR LA DE IONIC PARA TRANSICIONES NATIVAS
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // FIJA EL IDIOMA POR DEFECTO DE LA APP A ESPAÑOL PARA FECHAS Y NUMEROS
    { provide: LOCALE_ID, useValue: 'es' },
  ],
  // COMPONENTE QUE SE INSTANCIA AL ARRANCAR LA APLICACION
  bootstrap: [AppComponent],
  // PERMITE USAR ELEMENTOS PERSONALIZADOS COMO SWIPER-CONTAINER Y PHOSPHOR-ICONS
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
