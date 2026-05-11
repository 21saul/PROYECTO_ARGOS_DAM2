// IMPORTACION DEL ESQUEMA QUE PERMITE WEB COMPONENTS Y DEL DECORADOR NGMODULE
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
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
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  // COMPONENTE QUE SE INSTANCIA AL ARRANCAR LA APLICACION
  bootstrap: [AppComponent],
  // PERMITE USAR ELEMENTOS PERSONALIZADOS COMO SWIPER-CONTAINER Y PHOSPHOR-ICONS
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
