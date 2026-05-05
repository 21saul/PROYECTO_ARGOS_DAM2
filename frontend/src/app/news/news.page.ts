import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { gsap } from 'gsap';

type Severity = 'critical' | 'important' | 'resource';
type Category = 'all' | 'cve' | 'phishing' | 'breach' | 'tip';

interface NewsItem {
  id: number;
  severity: Severity;
  category: Category;
  title: string;
  source: string;
  sourceLogo: string;        // EMOJI O LETRA INICIAL DE LA FUENTE
  sourceColor: string;       // COLOR CARACTERÍSTICO DE LA FUENTE
  timeAgo: string;
  desc: string;
  cve?: string;
  cvssScore?: number;        // PUNTUACIÓN CVSS 0-10
  affectedProduct?: string;  // PRODUCTO AFECTADO (Windows, Chrome...)
  action?: string;
  customImage?: string;      // IMAGEN PERSONALIZADA POR EL USUARIO
  defaultImageSeed: number;  // SEED DE PICSUM PARA IMAGEN POR DEFECTO
}

interface SourceFeed {
  name: string;
  logo: string;
  color: string;
  active: boolean;
  count: number;            // Nº DE NOTICIAS HOY DE ESA FUENTE
}

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  standalone: false
})
export class NewsPage implements OnDestroy {

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  // STATS DEL PANEL
  cveCount = 12;            // CVES PUBLICADOS HOY
  avgCvss = 7.8;            // CVSS MEDIO
  activeFeeds = 4;          // FUENTES ACTIVAS
  lastUpdate = '2h';

  activeFilter: Category = 'all';
  currentEditingItem: NewsItem | null = null;

  filters: { label: string; value: Category; icon: string; count: number }[] = [
    { label: 'Todo',      value: 'all',      icon: 'list-bullets', count: 6 },
    { label: 'CVE',       value: 'cve',      icon: 'bug',          count: 2 },
    { label: 'Phishing',  value: 'phishing', icon: 'fish-simple',  count: 1 },
    { label: 'Brechas',   value: 'breach',   icon: 'warning-octagon', count: 1 },
    { label: 'Consejos',  value: 'tip',      icon: 'lightbulb',    count: 2 },
  ];

  sources: SourceFeed[] = [
    { name: 'INCIBE',           logo: 'I', color: '#003C71', active: true,  count: 3 },
    { name: 'Hispasec',         logo: 'H', color: '#E63946', active: true,  count: 2 },
    { name: 'BleepingComputer', logo: 'B', color: '#FF6B35', active: true,  count: 4 },
    { name: 'The Hacker News',  logo: 'T', color: '#0F4C5C', active: true,  count: 3 },
    { name: 'NVD',              logo: 'N', color: '#7C3AED', active: true,  count: 5 },
  ];

  allNews: NewsItem[] = [
    {
      id: 1, severity: 'critical', category: 'cve',
      title: 'Vulnerabilidad crítica en routers TP-Link Archer',
      source: 'INCIBE', sourceLogo: 'I', sourceColor: '#003C71',
      timeAgo: 'Hace 2h',
      desc: 'CVE-2026-1234 permite ejecución remota de código sin autenticación en modelos Archer C7, C9, C20.',
      cve: 'CVE-2026-1234', cvssScore: 9.8,
      affectedProduct: 'TP-Link Archer',
      action: 'Actualiza el firmware desde la web oficial de TP-Link',
      defaultImageSeed: 180
    },
    {
      id: 2, severity: 'important', category: 'phishing',
      title: 'Campaña masiva de phishing suplanta a la AEAT',
      source: 'Hispasec', sourceLogo: 'H', sourceColor: '#E63946',
      timeAgo: 'Hace 5h',
      desc: 'SMS masivos con asunto "devolución de impuestos pendiente" redirigen a webs fraudulentas que copian el portal de la Agencia Tributaria.',
      action: 'Accede siempre desde la web oficial agenciatributaria.gob.es',
      defaultImageSeed: 237
    },
    {
      id: 3, severity: 'resource', category: 'tip',
      title: 'Nuevo laboratorio gratuito de Wireshark en TryHackMe',
      source: 'TryHackMe', sourceLogo: 'T', sourceColor: '#88CC14',
      timeAgo: 'Ayer',
      desc: 'Sala interactiva sobre análisis de tráfico de red con casos prácticos forenses, añadida al Roadmap SOC.',
      defaultImageSeed: 42
    },
    {
      id: 4, severity: 'critical', category: 'cve',
      title: '0-day en Windows Print Spooler activamente explotado',
      source: 'BleepingComputer', sourceLogo: 'B', sourceColor: '#FF6B35',
      timeAgo: 'Hace 8h',
      desc: 'Vulnerabilidad de escalada de privilegios local en Windows 10/11 sin parche oficial. Microsoft trabajando en hotfix.',
      cve: 'CVE-2026-5678', cvssScore: 8.4,
      affectedProduct: 'Windows 10/11',
      action: 'Desactiva el servicio Print Spooler si no usas impresoras',
      defaultImageSeed: 119
    },
    {
      id: 5, severity: 'important', category: 'breach',
      title: '16 extensiones maliciosas detectadas en Chrome Web Store',
      source: 'The Hacker News', sourceLogo: 'T', sourceColor: '#0F4C5C',
      timeAgo: 'Hace 1d',
      desc: 'Más de 3 millones de instalaciones acumuladas. Las extensiones recopilaban historial de navegación y credenciales.',
      action: 'Revisa tus extensiones en chrome://extensions y elimina las desconocidas',
      defaultImageSeed: 334
    },
    {
      id: 6, severity: 'resource', category: 'tip',
      title: 'INCIBE publica guía de seguridad para familias',
      source: 'INCIBE', sourceLogo: 'I', sourceColor: '#003C71',
      timeAgo: 'Hace 2d',
      desc: 'Guía gratuita de 40 páginas con consejos prácticos para proteger a menores en internet. Disponible en PDF.',
      defaultImageSeed: 76
    },
  ];

  ngOnInit() {
    this.loadCustomImages();
  }

  ionViewDidEnter() {
    this.animateEntrance();
  }

  animateEntrance() {
    gsap.killTweensOf('.stats-banner, .source-chip, .featured-card, .news-card, .filter-pill');

    gsap.fromTo('.stats-banner',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });

    gsap.fromTo('.source-chip',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, stagger: 0.05,
        ease: 'power2.out', delay: 0.2 });

    gsap.fromTo('.filter-pill',
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, stagger: 0.04,
        ease: 'power2.out', delay: 0.4 });

    gsap.fromTo('.featured-card',
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5,
        ease: 'back.out(1.4)', delay: 0.5 });

    gsap.fromTo('.news-card',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.08,
        ease: 'power2.out', delay: 0.7 });
  }

  get featuredNews(): NewsItem | null {
    return this.allNews.find(n => n.severity === 'critical') || null;
  }

  get filteredNews(): NewsItem[] {
    const featured = this.featuredNews;
    let list = this.allNews.filter(n => n.id !== featured?.id);
    if (this.activeFilter === 'all') return list;
    return list.filter(n => n.category === this.activeFilter);
  }

  setFilter(f: Category) {
    this.activeFilter = f;
    setTimeout(() => {
      gsap.fromTo('.news-card',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
    }, 30);
  }

  getSeverityLabel(s: Severity): string {
    if (s === 'critical')  return 'CRÍTICO';
    if (s === 'important') return 'IMPORTANTE';
    return 'RECURSO';
  }

  getSeverityColor(s: Severity): string {
    if (s === 'critical')  return 'var(--color-danger)';
    if (s === 'important') return 'var(--color-warning)';
    return 'var(--color-secondary)';
  }

  getCvssColor(score: number): string {
    if (score >= 9) return 'var(--color-danger)';
    if (score >= 7) return 'var(--color-warning)';
    if (score >= 4) return 'var(--color-accent)';
    return 'var(--color-success)';
  }

  getCvssLabel(score: number): string {
    if (score >= 9) return 'Crítico';
    if (score >= 7) return 'Alto';
    if (score >= 4) return 'Medio';
    return 'Bajo';
  }

  getNewsImage(item: NewsItem): string {
    if (item.customImage) return item.customImage;
    return `https://picsum.photos/seed/${item.defaultImageSeed}/600/300`;
  }

  // ABRIR SELECTOR DE IMAGEN PARA UNA CARD
  openImagePicker(item: NewsItem, event: Event) {
    event.stopPropagation();
    this.currentEditingItem = item;
    this.imageInput.nativeElement.click();
  }

  // MANEJAR IMAGEN SELECCIONADA
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    if (!this.currentEditingItem) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagen demasiado grande. Máx 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (this.currentEditingItem) {
        this.currentEditingItem.customImage = e.target.result;
        this.saveCustomImages();
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  // RESET IMAGEN POR DEFECTO
  resetImage(item: NewsItem, event: Event) {
    event.stopPropagation();
    delete item.customImage;
    this.saveCustomImages();
  }

  private saveCustomImages() {
    const data: {[id: number]: string} = {};
    this.allNews.forEach(n => {
      if (n.customImage) data[n.id] = n.customImage;
    });
    localStorage.setItem('argos-news-images', JSON.stringify(data));
  }

  private loadCustomImages() {
    const saved = localStorage.getItem('argos-news-images');
    if (!saved) return;
    try {
      const data: {[id: number]: string} = JSON.parse(saved);
      this.allNews.forEach(n => {
        if (data[n.id]) n.customImage = data[n.id];
      });
    } catch (e) {}
  }

  refreshNews() {
    gsap.to('.refresh-icon', { rotation: 360, duration: 0.6, ease: 'power2.inOut' });
    // EN REAL HARÍA UN FETCH; AQUÍ SOLO RE-ANIMAMOS
    setTimeout(() => this.animateEntrance(), 200);
  }

  ngOnDestroy() {
    gsap.killTweensOf('.stats-banner, .source-chip, .featured-card, .news-card, .filter-pill, .refresh-icon');
  }
}
