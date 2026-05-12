// NEWS SERVICE
//
// RESUMEN: GESTIONA EL PANEL DE NOTICIAS DE CIBERSEGURIDAD Y
// ALERTAS CVE. CONSUME LOS ENDPOINTS DEL BACKEND QUE A SU VEZ
// SIRVEN LA CACHE POBLADA POR LOS WORKFLOWS DE N8N CADA 24H.
//
// LOGICA DE NEGOCIO: TRES METODOS COMPLEMENTARIOS. EL LISTADO
// ALIMENTA LAS CARDS PRINCIPALES. EL DE STATS ALIMENTA EL BANNER
// SUPERIOR. EL DE BREAKING DEVUELVE LA NOTICIA CRITICA MAS
// RECIENTE PARA LA CARD HERO ANIMADA.

// IMPORTACION DEL DECORADOR Injectable DE ANGULAR
import { Injectable } from '@angular/core';
// IMPORTACION DEL CLIENTE HTTP CENTRALIZADO
import { ApiService } from './api.service';

// CATEGORIAS PERMITIDAS POR EL ENUM DEL BACKEND
export type NewsCategory = 'cve' | 'phishing' | 'breach' | 'resource';
// NIVELES DE SEVERIDAD PERMITIDOS POR EL ENUM DEL BACKEND
export type NewsSeverity = 'low' | 'medium' | 'high' | 'critical';

// FORMA DE UNA NOTICIA INDIVIDUAL TAL Y COMO LA DEVUELVE EL BACKEND
export interface NewsItem {
  // IDENTIFICADOR UNICO DE LA NOTICIA EN BD
  id: number;
  // CATEGORIA A LA QUE PERTENECE LA NOTICIA
  category: NewsCategory;
  // FUENTE ORIGINAL (NVD, INCIBE, HISPASEC, ETC.)
  source: string;
  // TITULAR DE LA NOTICIA
  title: string;
  // CUERPO RESUMIDO DE LA NOTICIA
  description: string;
  // URL ORIGINAL DE LA FUENTE
  url: string;
  // IDENTIFICADOR CVE SI APLICA, NULL EN OTRAS CATEGORIAS
  cve_id: string | null;
  // PUNTUACION CVSS NUMERICA O NULL
  cvss_score: number | null;
  // NIVEL DE SEVERIDAD PARA COLOREAR LA CARD
  severity: NewsSeverity;
  // PRODUCTO AFECTADO SI APLICA, NULL EN OTRAS CATEGORIAS
  affected_product: string | null;
  // FECHA DE PUBLICACION ORIGINAL
  published_at: string;
  // FECHA DE INSERCION EN LA CACHE DEL BACKEND
  created_at: string;
}

// FORMA DE LAS ESTADISTICAS AGREGADAS DEL BANNER SUPERIOR
export interface NewsStats {
  // NUMERO DE CVES PUBLICADOS HOY
  cves_today: number;
  // CVSS MEDIO DE LOS CVES PUBLICADOS HOY
  cvss_average: number;
  // CONTADOR DE FUENTES UNICAS ACTIVAS
  sources_active: number;
  // LISTA DE NOMBRES DE FUENTES ACTIVAS
  source_list: string[];
}

// FORMA DE LA RESPUESTA DEL ENDPOINT DE LISTADO PAGINADO
export interface NewsListResponse {
  // ARRAY CON LAS NOTICIAS DE LA PAGINA ACTUAL
  items: NewsItem[];
  // METADATOS DE PAGINACION
  pagination: {
    // INDICE DE PAGINA SOLICITADA
    page: number;
    // TAMANO DE PAGINA SOLICITADO
    limit: number;
    // TOTAL DE NOTICIAS QUE CUMPLEN EL FILTRO
    total: number;
    // TOTAL DE PAGINAS DERIVADAS DEL FILTRO
    pages: number;
  };
  // FILTROS APLICADOS EN LA CONSULTA ACTUAL
  filters: {
    // CATEGORIA APLICADA O NULL SI ES TODO
    category: NewsCategory | null;
    // SEVERIDAD APLICADA O NULL
    severity: NewsSeverity | null;
  };
}

@Injectable({ providedIn: 'root' })
export class NewsService {

  // CONSTRUCTOR QUE INYECTA EL CLIENTE HTTP CENTRAL
  constructor(private api: ApiService) {}

  // LISTA NOTICIAS PAGINADAS Y FILTRABLES
  async list(options?: {
    category?: NewsCategory;
    severity?: NewsSeverity;
    page?: number;
    limit?: number;
  }): Promise<NewsListResponse> {
    // CONSTRUYE EL CONJUNTO DE PARAMETROS QUERY DE FORMA CONDICIONAL
    const params: any = {};
    // SOLO INCLUYE category SI VIENE DEFINIDO PARA NO ENVIAR LITERAL undefined
    if (options?.category) params.category = options.category;
    // SOLO INCLUYE severity SI VIENE DEFINIDO
    if (options?.severity) params.severity = options.severity;
    // PAGINA SOLO SI SE INDICA EXPLICITAMENTE
    if (options?.page) params.page = options.page;
    // LIMITE SOLO SI SE INDICA EXPLICITAMENTE
    if (options?.limit) params.limit = options.limit;

    // LLAMA AL ENDPOINT DE LISTADO Y CONVIERTE EL OBSERVABLE A PROMISE
    const response = await this.api.get<NewsListResponse>('/news', params).toPromise();
    // VALIDACION DEFENSIVA POR SI LA CAPA HTTP DEVUELVE UNDEFINED
    if (!response) throw new Error('Respuesta vacia del servidor');
    // RETORNA LA RESPUESTA TIPADA AL COMPONENTE
    return response;
  }

  // DEVUELVE ESTADISTICAS DIARIAS PARA EL BANNER
  async getStats(): Promise<NewsStats> {
    // LLAMADA AL ENDPOINT DE STATS DEL PANEL DE NOTICIAS
    const stats = await this.api.get<NewsStats>('/news/stats').toPromise();
    // VALIDACION DEFENSIVA POR SI LA CAPA HTTP DEVUELVE UNDEFINED
    if (!stats) throw new Error('Respuesta vacia del servidor');
    // RETORNA LAS ESTADISTICAS AL COMPONENTE
    return stats;
  }

  // DEVUELVE LA NOTICIA CRITICA MAS RECIENTE
  async getBreaking(): Promise<NewsItem | null> {
    try {
      // LLAMADA AL ENDPOINT DE BREAKING; PUEDE NO HABER NOTICIA CRITICA
      return await this.api.get<NewsItem>('/news/breaking').toPromise() ?? null;
    } catch {
      // SI NO HAY BREAKING O FALLA, DEVOLVEMOS NULL PARA QUE LA UI LO OCULTE
      return null;
    }
  }
}
