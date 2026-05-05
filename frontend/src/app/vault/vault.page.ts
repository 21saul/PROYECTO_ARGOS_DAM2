import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { gsap } from 'gsap';

type ItemType = 'password' | 'note' | 'file';
type ViewTab = 'all' | 'password' | 'note' | 'file';

interface VaultItem {
  id: number;
  type: ItemType;
  name: string;
  username?: string;
  noteSnippet?: string;
  fileSize?: string;
  fileExt?: string;
  color: string;
  initial: string;
  folderId: number;
  strength?: 'strong' | 'medium' | 'weak';
  lastModified: string;
  customIcon?: string;
}

interface VaultFolder {
  id: number;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
  healthScore: number;
}

@Component({
  selector: 'app-vault',
  templateUrl: './vault.page.html',
  styleUrls: ['./vault.page.scss'],
  standalone: false
})
export class VaultPage implements OnInit, OnDestroy {

  @ViewChild('iconInput') iconInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  searchQuery = '';
  activeTab: ViewTab = 'all';
  activeFolderId: number | null = null;
  fabOpen = false;
  showCipherAnim = false;

  totalEntries = 14;
  strongPercent = 64;
  storageUsedMb = 12.4;
  storageTotalMb = 50;

  folders: VaultFolder[] = [
    { id:1, name:'Bancos',   icon:'bank',          color:'#0EA5E9', itemCount:3, healthScore:95 },
    { id:2, name:'Email',    icon:'envelope',      color:'#EC4899', itemCount:2, healthScore:88 },
    { id:3, name:'RRSS',     icon:'share-network', color:'#F59E0B', itemCount:4, healthScore:60 },
    { id:4, name:'Trabajo',  icon:'briefcase',     color:'#7C3AED', itemCount:3, healthScore:82 },
    { id:5, name:'Familia',  icon:'house-line',    color:'#10B981', itemCount:2, healthScore:70 },
  ];

  items: VaultItem[] = [
    { id:1,  type:'password', name:'Gmail',       username:'usuario@gmail.com',
      color:'#EA4335', initial:'G', folderId:2, strength:'strong', lastModified:'Hace 2d' },
    { id:2,  type:'password', name:'Netflix',     username:'usuario@gmail.com',
      color:'#E50914', initial:'N', folderId:3, strength:'medium', lastModified:'Hace 5d' },
    { id:3,  type:'password', name:'BBVA',        username:'usuario****123',
      color:'#004B87', initial:'B', folderId:1, strength:'strong', lastModified:'Hace 1d' },
    { id:4,  type:'password', name:'WiFi Casa',   username:'Red_ARGOS_5G',
      color:'#10B981', initial:'W', folderId:5, strength:'weak',   lastModified:'Hace 1m' },
    { id:5,  type:'password', name:'Instagram',   username:'@usuario_argos',
      color:'#C13584', initial:'I', folderId:3, strength:'medium', lastModified:'Hace 7d' },
    { id:6,  type:'password', name:'Amazon',      username:'usuario@gmail.com',
      color:'#FF9900', initial:'A', folderId:1, strength:'strong', lastModified:'Hace 3d' },
    { id:7,  type:'note', name:'Frase semilla cripto', noteSnippet:'12 palabras Bitcoin · Modificada hace...',
      color:'#7C3AED', initial:'📝', folderId:1, lastModified:'Hace 30d' },
    { id:8,  type:'note', name:'PIN tarjeta sanitaria', noteSnippet:'4 dígitos · Médico de cabecera · Centro...',
      color:'#06B6D4', initial:'📝', folderId:5, lastModified:'Hace 14d' },
    { id:9,  type:'note', name:'Códigos 2FA backup',    noteSnippet:'8 códigos de respaldo · Gmail, Banco...',
      color:'#10B981', initial:'📝', folderId:2, lastModified:'Hace 9d' },
    { id:10, type:'file', name:'DNI escaneado',  fileSize:'1.2 MB', fileExt:'PDF',
      color:'#EF4444', initial:'📄', folderId:4, lastModified:'Hace 60d' },
    { id:11, type:'file', name:'Contrato laboral', fileSize:'380 KB', fileExt:'PDF',
      color:'#EF4444', initial:'📄', folderId:4, lastModified:'Hace 90d' },
    { id:12, type:'file', name:'Tarjeta sanitaria', fileSize:'2.1 MB', fileExt:'JPG',
      color:'#10B981', initial:'🖼', folderId:5, lastModified:'Hace 45d' },
    { id:13, type:'file', name:'Recibo nóminas Q4', fileSize:'4.8 MB', fileExt:'PDF',
      color:'#EF4444', initial:'📄', folderId:4, lastModified:'Hace 7d' },
    { id:14, type:'password', name:'LinkedIn',  username:'usuario@empresa.com',
      color:'#0A66C2', initial:'L', folderId:4, strength:'strong', lastModified:'Hace 12d' },
  ];

  ngOnInit() {
    this.loadCustomIcons();
  }

  ionViewDidEnter() {
    this.animateEntrance();
  }

  animateEntrance() {
    gsap.killTweensOf('.vault-stats-banner, .stat-pill, .folder-card, .vault-item, .tab-pill');

    gsap.fromTo('.vault-stats-banner',
      { y:-20, opacity:0 },
      { y:0, opacity:1, duration:0.5, ease:'power2.out' });

    gsap.fromTo('.stat-pill',
      { scale:0.85, opacity:0 },
      { scale:1, opacity:1, duration:0.35, stagger:0.06,
        ease:'back.out(1.4)', delay:0.15 });

    gsap.fromTo('.tab-pill',
      { y:12, opacity:0 },
      { y:0, opacity:1, duration:0.3, stagger:0.05,
        ease:'power2.out', delay:0.3 });

    gsap.fromTo('.folder-card',
      { x:-20, opacity:0 },
      { x:0, opacity:1, duration:0.4, stagger:0.06,
        ease:'power2.out', delay:0.4 });

    gsap.fromTo('.vault-item',
      { y:16, opacity:0 },
      { y:0, opacity:1, duration:0.35, stagger:0.06,
        ease:'power2.out', delay:0.55 });
  }

  get filteredItems(): VaultItem[] {
    let list = this.items;
    if (this.activeTab !== 'all') {
      list = list.filter(i => i.type === this.activeTab);
    }
    if (this.activeFolderId !== null) {
      list = list.filter(i => i.folderId === this.activeFolderId);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.username || '').toLowerCase().includes(q));
    }
    return list;
  }

  setTab(tab: ViewTab) {
    this.activeTab = tab;
    setTimeout(() => {
      gsap.fromTo('.vault-item',
        { y:12, opacity:0 },
        { y:0, opacity:1, duration:0.3, stagger:0.05, ease:'power2.out' });
    }, 30);
  }

  selectFolder(id: number | null) {
    this.activeFolderId = this.activeFolderId === id ? null : id;
    setTimeout(() => {
      gsap.fromTo('.vault-item',
        { x:-20, opacity:0 },
        { x:0, opacity:1, duration:0.3, stagger:0.05, ease:'power2.out' });
    }, 30);
  }

  getFolderName(id: number): string {
    return this.folders.find(f => f.id === id)?.name || '';
  }

  getFolderColor(id: number): string {
    return this.folders.find(f => f.id === id)?.color || 'var(--color-text-muted)';
  }

  getStrengthColor(s?: string): string {
    if (s === 'strong') return 'var(--color-success)';
    if (s === 'medium') return 'var(--color-warning)';
    if (s === 'weak')   return 'var(--color-danger)';
    return 'var(--color-text-muted)';
  }

  getStrengthLabel(s?: string): string {
    if (s === 'strong') return 'Fuerte';
    if (s === 'medium') return 'Media';
    if (s === 'weak')   return 'Débil';
    return '';
  }

  getHealthColor(score: number): string {
    if (score >= 85) return 'var(--color-success)';
    if (score >= 65) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  getStorageProgress(): number {
    return (this.storageUsedMb / this.storageTotalMb) * 100;
  }

  copyPassword(item: VaultItem, event: Event) {
    event.stopPropagation();
    gsap.fromTo(`#item-${item.id}`,
      { scale:1 },
      { scale:0.96, duration:0.1, yoyo:true, repeat:1 });
  }

  toggleFab() {
    this.fabOpen = !this.fabOpen;
  }

  addPassword() {
    this.fabOpen = false;
  }

  addNote() {
    this.fabOpen = false;
  }

  addFile() {
    this.fabOpen = false;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.showCipherAnim = true;
    setTimeout(() => {
      this.showCipherAnim = false;
    }, 2400);

    input.value = '';
  }

  private currentEditingItem: VaultItem | null = null;

  openIconPicker(item: VaultItem, event: Event) {
    event.stopPropagation();
    this.currentEditingItem = item;
    this.iconInput.nativeElement.click();
  }

  onIconSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    if (!this.currentEditingItem) return;
    const file = input.files[0];
    if (file.size > 1024 * 1024) {
      alert('Imagen demasiado grande (máx 1MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (this.currentEditingItem) {
        this.currentEditingItem.customIcon = e.target.result;
        this.saveCustomIcons();
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  private saveCustomIcons() {
    const data: {[id: number]: string} = {};
    this.items.forEach(it => {
      if (it.customIcon) data[it.id] = it.customIcon;
    });
    localStorage.setItem('argos-vault-icons', JSON.stringify(data));
  }

  private loadCustomIcons() {
    const saved = localStorage.getItem('argos-vault-icons');
    if (!saved) return;
    try {
      const data: {[id: number]: string} = JSON.parse(saved);
      this.items.forEach(it => { if (data[it.id]) it.customIcon = data[it.id]; });
    } catch (e) {}
  }

  ngOnDestroy() {
    gsap.killTweensOf('.vault-stats-banner, .stat-pill, .folder-card, .vault-item, .tab-pill');
  }
}
