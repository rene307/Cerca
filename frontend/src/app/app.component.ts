import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Categoria =
  | 'Todos'
  | 'Cafés'
  | 'Panaderías'
  | 'Computación'
  | 'Viveros'
  | 'Farmacias'
  | 'Mecánicos'
  | 'Bares'
  | 'Peluquería'
  | 'Mascotas'
  | 'Vulcanización'
  | 'Tiendas'
  | 'Servicios';


// Preferencias de programación para el futuro servidor de campañas.
// Ninguna acción de este frontend envía emails ni mensajes.
type FrecuenciaCampana = 'diaria' | 'semanal' | 'mensual' | 'anual';
type CanalCampana = 'email' | 'whatsapp';
type ContenidoCampana = 'promociones' | 'actualizaciones' | 'ambas';
interface ProgramacionCampana {
  frecuencia: FrecuenciaCampana;
  hora: string;            // HH:mm, zona America/Santiago
  diaSemana: number;       // 0=domingo, 1=lunes,...6=sábado
  diaMes: number;          // 1..28, evita diferencias entre meses
  mesAnual: number;        // 1..12
  diaAnual: number;        // 1..31 según mes
  canal: CanalCampana;
  contenido: ContenidoCampana;
  comuna: string;          // Todas o comuna concreta
  categoria: string;       // Todas o categoría de interés
  asunto: string;
  mensaje: string;
  activa: boolean;
}

interface Negocio {
  id: number;
  nombre: string;
  categoria: Exclude<Categoria, 'Todos'>;
  comuna: string;
  descripcion: string;
  distancia?: number;
  calificacion?: number;
  opiniones?: number;
  foto: string;
  icono: string;
  pinX?: number;
  pinY?: number;
  direccion?: string;
  origen?: 'captura' | 'manual';
  publicado?: boolean;
  destacado?: boolean;
  prioridadDestacado?: number;
  whatsapp?: string;       // +569XXXXXXXX; only configured numbers activate contact.
  telefono?: string;       // Teléfono público. No implica que tenga WhatsApp.
  fuenteRevision?: string; // Origen público de la actualización.
  fechaRevision?: string;  // Fecha de consulta, no fecha de confirmación por el comercio.
  observacionRevision?: string; // Discrepancias o limitaciones de la fuente.
  sitioWeb?: string;       // only HTTPS links are offered.
  horario?: string;        // confirmed textual opening hours.
  latitud?: number;       // real latitude confirmed by administrator.
  longitud?: number;      // real longitude confirmed by administrator.
  datosVerificados?: boolean;

}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnDestroy {
  readonly categorias: { nombre: Categoria; icono: string }[] = [
    { nombre: 'Todos', icono: '✦' },
    { nombre: 'Cafés', icono: '☕' },
    { nombre: 'Panaderías', icono: '🥖' },
    { nombre: 'Computación', icono: '💻' },
    { nombre: 'Viveros', icono: '🌿' },
    { nombre: 'Farmacias', icono: '💊' },
    { nombre: 'Mecánicos', icono: '🔧' },
    { nombre: 'Bares', icono: '♜' },
    { nombre: 'Peluquería', icono: '✂' },
    { nombre: 'Mascotas', icono: '🐾' },
    { nombre: 'Vulcanización', icono: '◎' },
    { nombre: 'Tiendas', icono: '▣' },
    { nombre: 'Servicios', icono: '⚒' }
  ];

  readonly comunas = [
    'La Florida',
    'Peñalolén',
    'Macul',
    'Puente Alto',
    'Ñuñoa',
    'Providencia',
    'Santiago'
  ];

  // NEGOCIOS Y DISTANCIAS DE EJEMPLO: no provienen de una base de datos ni de GPS.
  negocios: Negocio[] = [
    {
      id: 10, nombre: "Café del Jardín", categoria: "Cafés", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Parque Las Mercedes 3298",
      foto: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900&q=85&fit=crop", icono: "☕", origen: 'captura',
      horario: "Lun–Vie 18:00–21:00; sáb–dom cerrado (publicado; confirmar)",
      telefono: "+56 9 5879 0169",
      fuenteRevision: "https://es.restaurantguru.com/Cafe-del-Jardin-La-Florida-2",
      observacionRevision: "Teléfono y horario coinciden con directorios independientes.",
      fechaRevision: "2026-10-18",
    },
    {
      id: 11, nombre: "KABI Pastelería y Cafetería", categoria: "Cafés", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Av. La Florida 8791",
      foto: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=85&fit=crop", icono: "☕", origen: 'captura',
      telefono: "+56 9 3647 0275",
      fuenteRevision: "Ficha pública del negocio en resultados de mapas",
      observacionRevision: "Horarios inconsistentes entre fuentes; no rellenar.",
      fechaRevision: "2026-10-18",
    },
    {
      id: 12, nombre: "La Duquesa Bakery", categoria: "Cafés", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Walker Martínez",
      foto: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=85&fit=crop", icono: "☕", origen: 'captura',
      telefono: "+56 9 6130 1176",
      fuenteRevision: "Ficha pública del negocio en resultados de mapas",
      observacionRevision: "Horario sin confirmar por el local.",
      fechaRevision: "2026-10-18",
    },
    {
      id: 13, nombre: "Cafetería del Rey Brujo", categoria: "Cafés", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Escuadrón 2058",
      foto: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900&q=85&fit=crop", icono: "☕", origen: 'captura',
      fuenteRevision: "Ficha pública del negocio en resultados de mapas",
      observacionRevision: "Horario por confirmar en el local.",
      fechaRevision: "2026-10-18",
    },
    {
      id: 14, nombre: "Cafetería Robusta", categoria: "Cafés", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Av. Vicuña Mackenna Poniente",
      foto: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=85&fit=crop", icono: "☕", origen: 'captura'
    },
    {
      id: 15, nombre: "Hola Ola", categoria: "Cafés", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Dr. Sótero del Río 77",
      foto: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=85&fit=crop", icono: "☕", origen: 'captura'
    },
    {
      id: 16, nombre: "Amasandería Walker", categoria: "Panaderías", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Walker Martínez 2023",
      foto: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=85&fit=crop", icono: "🥖", origen: 'captura'
    },
    {
      id: 17, nombre: "Amasandería La Espiga", categoria: "Panaderías", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Pedro Donoso 8779",
      foto: "https://images.unsplash.com/photo-1608198093002-ad4e005484df?w=900&q=85&fit=crop", icono: "🥖", origen: 'captura'
    },
    {
      id: 18, nombre: "Pastelería Dulce Almendra", categoria: "Panaderías", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Los Melares",
      foto: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=85&fit=crop", icono: "🥖", origen: 'captura'
    },
    {
      id: 19, nombre: "Amasandería y Pastelería Lucas", categoria: "Panaderías", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      foto: "https://images.unsplash.com/photo-1608198093002-ad4e005484df?w=900&q=85&fit=crop", icono: "🥖", origen: 'captura'
    },
    {
      id: 20, nombre: "Amasandería Edwards", categoria: "Panaderías", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Araucanía",
      foto: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=85&fit=crop", icono: "🥖", origen: 'captura'
    },
    {
      id: 21, nombre: "Amasandería Camila", categoria: "Panaderías", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "José Miguel Carrera",
      foto: "https://images.unsplash.com/photo-1608198093002-ad4e005484df?w=900&q=85&fit=crop", icono: "🥖", origen: 'captura'
    },
    {
      id: 22, nombre: "CHECK Servicio Técnico Computación", categoria: "Computación", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Av. Américo Vespucio 7500",
      foto: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=85&fit=crop", icono: "💻", origen: 'captura'
    },
    {
      id: 23, nombre: "Servicio Técnico Computadores ComputerTech", categoria: "Computación", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Los Evangelizadores 1217",
      foto: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&q=85&fit=crop", icono: "💻", origen: 'captura'
    },
    {
      id: 24, nombre: "TÉCNICO COMPUTACIÓN", categoria: "Computación", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Real Alicante 6671",
      foto: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=85&fit=crop", icono: "💻", origen: 'captura'
    },
    {
      id: 25, nombre: "La Pelu La Florida", categoria: "Peluquería", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      foto: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=85&fit=crop", icono: "✂️", origen: 'captura'
    },
    {
      id: 26, nombre: "Peluquería y Salón Cataleya Beauty Center", categoria: "Peluquería", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      foto: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=85&fit=crop", icono: "✂️", origen: 'captura'
    },
    {
      id: 27, nombre: "Salón Jaime Adrián", categoria: "Peluquería", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      foto: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=85&fit=crop", icono: "✂️", origen: 'captura'
    },
    {
      id: 28, nombre: "Vulcanización La Florida", categoria: "Vulcanización", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Av. La Florida 7382",
      foto: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop", icono: "🔧", origen: 'captura'
    },
    {
      id: 29, nombre: "Vulcanización (Av. Departamental)", categoria: "Vulcanización", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Av. Departamental",
      foto: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=85&fit=crop", icono: "🔧", origen: 'captura'
    },
    {
      id: 30, nombre: "Redvulca a domicilio", categoria: "Vulcanización", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      foto: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop", icono: "🔧", origen: 'captura'
    },
    {
      id: 31, nombre: "El Neumatin (Chapatín)", categoria: "Vulcanización", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "La Primavera 1840",
      foto: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=85&fit=crop", icono: "🔧", origen: 'captura'
    },
    {
      id: 32, nombre: "Vulcanización Los Picaflores", categoria: "Vulcanización", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Av. Trinidad Oriente",
      foto: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop", icono: "🔧", origen: 'captura'
    },
    {
      id: 33, nombre: "Vulka Martín", categoria: "Vulcanización", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Las Hiedras",
      foto: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=85&fit=crop", icono: "🔧", origen: 'captura'
    },
    {
      id: 34, nombre: "Vivero Rincón Verde", categoria: "Viveros", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Rojas Magallanes 2565",
      foto: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&q=85&fit=crop", icono: "🌿", origen: 'captura'
    },
    {
      id: 35, nombre: "Vivero Pacífico", categoria: "Viveros", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Palena 2861",
      foto: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=900&q=85&fit=crop", icono: "🌿", origen: 'captura'
    },
    {
      id: 36, nombre: "Vivero Sanse", categoria: "Viveros", comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: "Vecinal 7233",
      foto: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85&fit=crop", icono: "🌿", origen: 'captura'
    },
    {
      id: 37, nombre: 'Mecánica a Domicilio 24/7', categoria: 'Mecánicos', comuna: 'La Florida',
      descripcion: 'Taller mecánico a domicilio. Información de la captura; fotografía genérica del rubro.',
      direccion: 'Del Prado 1683',
      foto: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop', icono: '🔧', origen: 'captura'
    },
    {
      id: 38, nombre: 'Mecánico 24/7 Alexander & Jofran', categoria: 'Mecánicos', comuna: 'Peñalolén',
      descripcion: 'Servicio mecánico 24/7 según la captura. Fotografía genérica del rubro.',
      foto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=85&fit=crop', icono: '🔧', origen: 'captura'
    },
    {
      id: 39, nombre: 'Mecánico 24 Horas', categoria: 'Mecánicos', comuna: 'Peñalolén',
      descripcion: 'Taller mecánico abierto 24 horas según la captura. Fotografía genérica del rubro.',
      foto: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop', icono: '🔧', origen: 'captura'
    },
    {
      id: 40, nombre: 'MP Garage - Taller Mecánico a Domicilio', categoria: 'Mecánicos', comuna: 'La Florida',
      descripcion: 'Servicio mecánico a domicilio visto en la búsqueda; comuna de atención por confirmar. Fotografía genérica.',
      foto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=85&fit=crop', icono: '🔧', origen: 'captura'
    },
    {
      id: 41, nombre: 'Mecánico Alex', categoria: 'Mecánicos', comuna: 'Macul',
      descripcion: 'Taller mecánico incluido desde la captura. Fotografía genérica del rubro.',
      foto: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop', icono: '🔧', origen: 'captura'
    },
    {
      id: 42, nombre: 'Farmacia Indi tu Farmacia Independiente', categoria: 'Farmacias', comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Av. La Florida 8220, local 9',
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop', icono: '💊', origen: 'captura'
    },
    {
      id: 43, nombre: 'Farmacia Arapharma', categoria: 'Farmacias', comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Av. La Florida 7034',
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop', icono: '💊', origen: 'captura',
      horario: "Lun–Vie 11:00–19:00; sáb–dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
      fechaRevision: "2026-10-18",
    },
    {
      id: 44, nombre: 'Farmacias Económicas', categoria: 'Farmacias', comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Av. Vicuña Mackenna 8188',
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop', icono: '💊', origen: 'captura',
      horario: "Lun–Sáb 10:00–20:00; dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
      fechaRevision: "2026-10-18",
    },
    {
      id: 45, nombre: 'Farmacia Vecinal', categoria: 'Farmacias', comuna: 'La Florida',
      destacado: true, prioridadDestacado: 1,
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Av. Vicuña Mackenna Poniente 6690, Local 12',
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop', icono: '💊', origen: 'captura',
      fuenteRevision: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
      observacionRevision: "Hay discrepancias de horarios y teléfonos entre directorios. No actualizar automáticamente esos campos.",
      fechaRevision: "2026-10-18",
    },
    {
      id: 46, nombre: 'Farmacia El Químico', categoria: 'Farmacias', comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Enrique Olivares 1278',
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop', icono: '💊', origen: 'captura',
      horario: "Lun–Jue 10:00–20:00; vie 10:00–14:00; sáb 10:00–19:00; dom 11:00–19:00 (publicado; confirmar)",
      fuenteRevision: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
      fechaRevision: "2026-10-18",
    },
    {
      id: 47, nombre: 'Farmacia BarrioFlorida', categoria: 'Farmacias', comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Rojas Magallanes 94, local B',
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop', icono: '💊', origen: 'captura',
      fuenteRevision: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
      observacionRevision: "En el registro público se llama BARRIO FARMA en Rojas Magallanes 94 B. Confirmar identidad antes de cambiar nombre u horario.",
      fechaRevision: "2026-10-18",
    },
    {
      id: 48, nombre: 'Farmacia Ciudadana La Florida', categoria: 'Farmacias', comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Las Pataguas 850',
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop', icono: '💊', origen: 'captura'
    },
    {
      id: 49, nombre: 'Farmacias Herrera', categoria: 'Farmacias', comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Paulina Ruso 8231',
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop', icono: '💊', origen: 'captura'
    },
    {
      id: 50, nombre: 'Eco Farmacias', categoria: 'Farmacias', comuna: 'La Florida',
      descripcion: 'Local incluido desde las capturas. Fotografía genérica representativa de su rubro.',
      direccion: 'Serafín Zamora 29, Local 19',
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop', icono: '💊', origen: 'captura',
      horario: "Lun–Vie 09:00–19:00; sáb 10:00–14:00; dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
      observacionRevision: "Nombre de calle corregido usando registro público; solo cambia la dirección si aún es la anterior.",
      fechaRevision: "2026-10-18",
    },
    {
      id: 51, nombre: 'Farmacenter', categoria: 'Farmacias', comuna: 'La Florida',
      destacado: true, prioridadDestacado: 2,
      descripcion: 'Farmacia de Vicuña Mackenna. Foto genérica ilustrativa; verificar información antes de publicar.',
      direccion: 'Av. Vicuña Mackenna 6650, Local 2',
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura',
      fuenteRevision: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
      observacionRevision: "Los horarios se contradicen entre directorios públicos. No asignar un horario definitivo.",
      fechaRevision: "2026-10-18",
    },
    { id: 52, nombre: 'Farmacias Titán 24/7', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Av. Concha y Toro 2757', horario: '24 horas (por verificar)',
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      observacionRevision: "La condición 24/7/urgencia puede variar. Confirmar el régimen permanente y turnos.",
      fechaRevision: "2026-10-18",
    },
    { id: 53, nombre: 'Farmacia Dalem', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Av. Concha y Toro 2097', 
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true },
    { id: 54, nombre: 'Farmacia Solidaria', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Balmaceda 265', 
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun, mié–vie 09:00–14:00 y 15:00–18:00; mar 09:00–14:00 y 15:00–22:00; sáb 09:00–14:00; dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    { id: 55, nombre: 'Farmacia Roubillard S.A.', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Balmaceda 267', 
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Vie 09:30–14:00 y 15:30–21:00; sáb–dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    { id: 56, nombre: 'Farma Ulloa', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Av. Gabriela Poniente 835', 
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Sáb 09:00–21:00; dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    { id: 57, nombre: 'Farmacia San Carlos', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Av. San Carlos 0581', 
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Vie 09:00–16:30 y 17:00–21:00; sáb 10:00–16:30; dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    { id: 58, nombre: 'Farmacia de lo Alto', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Omar Herrera Gutiérrez 1815', 
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true },
    { id: 59, nombre: 'Farmacias Ahumada', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'La Florida (ubicación exacta por verificar)', 
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true },
    { id: 60, nombre: 'Farmacia Netfarma', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Av. Ejército Libertador 1139', 
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Vie 10:30–14:30 y 16:30–22:00; sáb–dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    { id: 61, nombre: 'Farmacias La Botika', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Av. El Peñón 1467', 
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Sáb 10:00–14:00 y 17:00–21:00; dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    { id: 62, nombre: 'Farmacias Olímpica - Puente Alto', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Av. Concha y Toro 1184, Local 3', 
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Sáb 09:00–15:00 y 17:00–20:00; dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    { id: 63, nombre: 'Farmacias Cruz Verde', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Strip Center, Av. Concha y Toro 3955', 
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Vie 09:00–22:30; sáb 09:30–22:30; dom 10:30–21:30 (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      observacionRevision: "Sólo la sucursal Av. Concha y Toro 3955, no generalizar a toda la cadena.",
      fechaRevision: "2026-10-18",
    },
    { id: 64, nombre: 'Farmacia Novasalud - Puente Alto', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: 'Balmaceda 371, locales 101-102', 
      foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Vie 09:30–19:30; sáb–dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    { id: 65, nombre: 'Farmacia Macarena', categoria: 'Farmacias', comuna: 'Puente Alto',
      descripcion: 'Comercio identificado en las capturas. Datos pendientes de confirmación por el local.',
      direccion: "Nonato Coo 3923", 
      foto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=85&fit=crop',
      icono: '💊', origen: 'captura', publicado: true,
      horario: "Lun–Vie 10:00–14:00 y 16:00–20:00; sáb 10:00–14:00; dom cerrado (publicado; confirmar)",
      fuenteRevision: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
      fechaRevision: "2026-10-18",
    },
    {
      id: 1, nombre: 'Café Macondo', categoria: 'Cafés', comuna: 'La Florida',
      descripcion: 'Café de especialidad, pastelería artesanal y un rincón para desconectarte.',
      distancia: 0.8, calificacion: 4.9, opiniones: 182,
      foto: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900&q=85&fit=crop',
      icono: '☕', pinX: 40, pinY: 49
    },
    {
      id: 2, nombre: 'Bar Esquina 21', categoria: 'Bares', comuna: 'La Florida',
      descripcion: 'Buena música, coctelería y picoteos para compartir.',
      distancia: 1.2, calificacion: 4.7, opiniones: 96,
      foto: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&q=85&fit=crop',
      icono: '🍸', pinX: 62, pinY: 28
    },
    {
      id: 3, nombre: 'Estudio Norte', categoria: 'Peluquería', comuna: 'La Florida',
      descripcion: 'Cortes, color, barbería y estilo para todos.',
      distancia: 1.1, calificacion: 4.8, opiniones: 74,
      foto: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=85&fit=crop',
      icono: '✂️', pinX: 73, pinY: 46
    },
    {
      id: 4, nombre: 'Mundo Mascota', categoria: 'Mascotas', comuna: 'La Florida',
      descripcion: 'Alimentos, accesorios y cariño para tus mascotas.',
      distancia: 1.3, calificacion: 4.9, opiniones: 68,
      foto: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900&q=85&fit=crop',
      icono: '🐾', pinX: 23, pinY: 74
    },
    {
      id: 5, nombre: 'VulcaExpress', categoria: 'Vulcanización', comuna: 'La Florida',
      descripcion: 'Neumáticos, reparación de pinchazos y asistencia automotriz.',
      distancia: 2.1, calificacion: 4.7, opiniones: 51,
      foto: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop',
      icono: '🔧', pinX: 35, pinY: 34
    },
    {
      id: 6, nombre: 'Verde Luna', categoria: 'Tiendas', comuna: 'La Florida',
      descripcion: 'Plantas, maceteros y detalles para regalar o decorar.',
      distancia: 0.95, calificacion: 4.6, opiniones: 90,
      foto: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=900&q=85&fit=crop',
      icono: '🌱', pinX: 80, pinY: 80
    },
    {
      id: 7, nombre: 'La Mesa del Barrio', categoria: 'Bares', comuna: 'Puente Alto',
      descripcion: 'Un lugar de encuentro con sabores locales y buena atención.',
      distancia: 3.2, calificacion: 4.7, opiniones: 42,
      foto: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=85&fit=crop',
      icono: '🍽️', pinX: 56, pinY: 60
    },
    {
      id: 8, nombre: 'Casa Miga', categoria: 'Cafés', comuna: 'Ñuñoa',
      descripcion: 'Panadería de masa madre, desayunos y café recién preparado.',
      distancia: 2.7, calificacion: 4.8, opiniones: 61,
      foto: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=85&fit=crop',
      icono: '🥐', pinX: 60, pinY: 48
    },
    {
      id: 9, nombre: 'Tecno Barrio', categoria: 'Servicios', comuna: 'Providencia',
      descripcion: 'Reparación de computadores y asistencia tecnológica.',
      distancia: 4.2, calificacion: 4.6, opiniones: 48,
      foto: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=85&fit=crop',
      icono: '💻', pinX: 47, pinY: 37
    }
  ];

  busqueda = '';
  comuna = 'La Florida';
  categoriaActiva: Categoria = 'Todos';
  distanciaMaxima = 999;
  gpsHabilitado = false;
  estadoGPS = 'Activa tu ubicación para calcular kilómetros reales.';
  private posicionActual: { lat: number; lon: number } | null = null;
  private gpsWatchId: number | null = null;
  menuAbierto = false;
  mostrarSoloFavoritos = false;
  negocioSeleccionado: Negocio | null = null;
  mostrarPublicacion = false;
  readonly favoritos = new Set<number>();

  // DEMO: guardamos solo la decisión local para reconocer este navegador.
  // No se guardan teléfonos/correos ni se envían mensajes sin API/consentimiento verificable.
  mostrarSuscripcion = false;
  accesoConcedido = false;
  accesoRechazado = false;
  decisionSuscripcion: 'pendiente' | 'si' | 'no' = 'pendiente';
  private readonly claveDecisionVisitante = 'cerca_visitante_optin_v1';

  frecuenciaSuscripcion: Exclude<FrecuenciaCampana, 'anual'> = 'semanal';
  tipoPromociones = true;
  tipoActualizaciones = true;
  canalSuscripcion: CanalCampana = 'email';
  comunaSuscripcion = 'La Florida';
  rubroSuscripcion = 'Todos';
  contactoSuscripcion = '';
  consentimientoSuscripcion = false;
  errorSuscripcion = '';
  avisoSuscripcion = '';

  abrirSuscripcion(): void {
    this.mostrarSuscripcion = true;
    this.comunaSuscripcion = this.comuna;
    this.errorSuscripcion = '';
    this.avisoSuscripcion = '';
    // Una visita posterior puede consultar las preferencias sin registrar de nuevo.
    this.decisionSuscripcion = this.accesoConcedido ? 'si' : 'pendiente';
  }

  cerrarSuscripcion(): void {
    this.mostrarSuscripcion = false;
    this.errorSuscripcion = '';
    this.avisoSuscripcion = '';
    this.contactoSuscripcion = ''; // No conservar contacto si cierra la ventana.
    this.consentimientoSuscripcion = false;
  }

  elegirSuscripcion(decision: 'si' | 'no'): void {
    this.decisionSuscripcion = decision;
    this.errorSuscripcion = '';
    if (decision === 'no') {
      this.accesoConcedido = false;
      this.accesoRechazado = true;
      this.contactoSuscripcion = '';
      this.consentimientoSuscripcion = false;
      this.guardarDecisionLocal('no');
      this.mostrarSuscripcion = false;
    }
  }

  private guardarDecisionLocal(estado: 'si' | 'no'): void {
    // Esto identifica únicamente este navegador, NO una persona en otros equipos.
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.claveDecisionVisitante, JSON.stringify({
        estado, version: 1, fecha: new Date().toISOString()
      }));
    } catch {
      // Si el usuario bloqueó almacenamiento, la decisión dura solo esta sesión.
    }
  }

  validarSuscripcion(): void {
    this.errorSuscripcion = '';
    this.avisoSuscripcion = '';
    if (this.decisionSuscripcion !== 'si') {
      this.errorSuscripcion = 'Selecciona Sí para continuar.';
      return;
    }
    if (!this.tipoPromociones && !this.tipoActualizaciones) {
      this.errorSuscripcion = 'Selecciona promociones, actualizaciones o ambas.';
      return;
    }
    if (!this.consentimientoSuscripcion) {
      this.errorSuscripcion = 'Debes aceptar recibir las comunicaciones seleccionadas.';
      return;
    }
    const contacto = this.contactoSuscripcion.trim();
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto);
    const numero = contacto.replace(/[^0-9]/g, '');
    const whatsappValido = /^56[0-9]{9}$/.test(numero);
    if (this.canalSuscripcion === 'email' ? !correoValido : !whatsappValido) {
      this.errorSuscripcion = this.canalSuscripcion === 'email'
        ? 'Ingresa un correo electrónico válido.'
        : 'Ingresa WhatsApp con código de Chile: +56 9 XXXX XXXX.';
      return;
    }
    // DEMO SIN BACKEND: habilita navegación en este navegador, pero NO da de alta
    // al usuario en una lista de envío ni guarda su número/correo personal.
    this.accesoConcedido = true;
    this.accesoRechazado = false;
    this.guardarDecisionLocal('si');
    this.mostrarSuscripcion = false;
    this.contactoSuscripcion = '';
    this.consentimientoSuscripcion = false;
    this.avisoSuscripcion = '';
  }


  // Modo de edición local: no es un sistema de autenticación.
  // Se necesita API y control de roles en el servidor antes de ponerlo en producción.
  mostrarAdministracion = false;
  busquedaAdministracion = '';
  formularioAbierto = false;
  errorFormulario = '';
  avisoAdministracion = '';
  guardandoFoto = false;
  anuncioEditor: Negocio = this.formularioVacio();
  private readonly claveEdicion = 'cerca_editor_anuncios_v1';


  // Configuración local del administrador de campañas. No almacena suscriptores.
  pestanaAdmin: 'anuncios' | 'campanas' = 'anuncios';
  readonly nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  readonly diasMensuales = Array.from({ length: 28 }, (_, i) => i + 1);
  readonly nombreMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly frecuenciasCampana: FrecuenciaCampana[] = ['diaria', 'semanal', 'mensual', 'anual'];
  frecuenciaSeleccionada: FrecuenciaCampana = 'semanal';
  mensajeCampanas = '';
  readonly claveCampanas = 'cerca_configuracion_campanas_v1';
  configuracionCampanas: Record<FrecuenciaCampana, ProgramacionCampana> = {
    diaria: this.programacionBase('diaria'),
    semanal: this.programacionBase('semanal'),
    mensual: this.programacionBase('mensual'),
    anual: this.programacionBase('anual')
  };

  private programacionBase(frecuencia: FrecuenciaCampana): ProgramacionCampana {
    return {
      frecuencia, hora: '20:00', diaSemana: 5, diaMes: 5,
      mesAnual: 6, diaAnual: 5, canal: 'email',
      contenido: 'ambas', comuna: 'Todas', categoria: 'Todas',
      asunto: '', mensaje: '', activa: false
    };
  }

  get programacionActual(): ProgramacionCampana {
    return this.configuracionCampanas[this.frecuenciaSeleccionada];
  }

  get horarioCampana(): string {
    const p = this.programacionActual;
    const h = `${p.hora} (hora de Chile)`;
    if (p.frecuencia === 'diaria') return `Todos los días a las ${h}`;
    if (p.frecuencia === 'semanal') return `Cada ${this.nombreDia[Number(p.diaSemana)] || 'viernes'} a las ${h}`;
    if (p.frecuencia === 'mensual') return `El día ${p.diaMes} de cada mes a las ${h}`;
    return `Cada ${p.diaAnual} de ${this.nombreMes[Number(p.mesAnual) - 1] || 'junio'} a las ${h}`;
  }

  get filtroCampana(): string {
    const p = this.programacionActual;
    const tipo = p.contenido === 'ambas' ? 'promociones o actualizaciones' : p.contenido;
    return `Solo contactos con consentimiento activo, preferencia ${p.frecuencia}, canal ${p.canal === 'email' ? 'correo electrónico' : 'WhatsApp'}, interés en ${tipo}, comuna ${p.comuna}, rubro ${p.categoria}. Se excluirán bajas, contactos inválidos y envíos duplicados.`;
  }

  private programacionValida(p: unknown, frecuencia: FrecuenciaCampana): p is ProgramacionCampana {
    if (!p || typeof p !== 'object') return false;
    const v = p as ProgramacionCampana;
    if (v.frecuencia !== frecuencia) return false;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v.hora))) return false;
    if (!Number.isInteger(Number(v.diaSemana)) || Number(v.diaSemana) < 0 || Number(v.diaSemana) > 6) return false;
    if (!Number.isInteger(Number(v.diaMes)) || Number(v.diaMes) < 1 || Number(v.diaMes) > 28) return false;
    if (!Number.isInteger(Number(v.mesAnual)) || Number(v.mesAnual) < 1 || Number(v.mesAnual) > 12) return false;
    if (!Number.isInteger(Number(v.diaAnual)) || Number(v.diaAnual) < 1 || Number(v.diaAnual) > 31) return false;
    if (Number.isNaN(new Date(2025, Number(v.mesAnual)-1, Number(v.diaAnual)).getTime())) return false;
    const diasEnMes = new Date(2025, Number(v.mesAnual), 0).getDate();
    if (Number(v.diaAnual) > diasEnMes) return false;
    return ['email','whatsapp'].includes(v.canal) &&
      ['promociones','actualizaciones','ambas'].includes(v.contenido) &&
      typeof v.comuna === 'string' && typeof v.categoria === 'string' &&
      typeof v.asunto === 'string' && typeof v.mensaje === 'string' &&
      typeof v.activa === 'boolean';
  }

  guardarCampana(): void {
    const p = this.programacionActual;
    this.mensajeCampanas = '';
    if (!this.programacionValida(p, this.frecuenciaSeleccionada)) {
      this.mensajeCampanas = 'Revisa día, fecha y hora: la programación no es válida.';
      return;
    }
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.claveCampanas, JSON.stringify(this.configuracionCampanas));
      this.mensajeCampanas = 'Programación guardada en este navegador. No se ha realizado ningún envío.';
    } catch {
      this.mensajeCampanas = 'No fue posible guardar la programación en este navegador.';
    }
  }

  exportarCampanas(): void {
    if (typeof document === 'undefined') return;
    const datos = { timezone: 'America/Santiago', programaciones: this.configuracionCampanas };
    const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], {type: 'application/json'}));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'cerca-programacion-campanas.json';
    enlace.click();
    URL.revokeObjectURL(url);
    this.mensajeCampanas = 'Configuración exportada. Esto no envía mensajes.';
  }

  constructor() {
    if (typeof document !== 'undefined') {
      let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.type = 'image/png';
      favicon.href = 'assets/cerca-favicon.png';
    }
    if (typeof window === 'undefined') return;
    this.mostrarAdministracion = window.location.hash === '#admin';
    try {
      const decisionGuardada = JSON.parse(window.localStorage.getItem(this.claveDecisionVisitante) || 'null');
      if (decisionGuardada?.version === 1 && decisionGuardada?.estado === 'si') {
        this.accesoConcedido = true;
      } else if (decisionGuardada?.version === 1 && decisionGuardada?.estado === 'no') {
        this.accesoRechazado = true;
      }
    } catch {
      // Mostrar la burbuja si el navegador no permite leer el almacenamiento.
    }
    // Guarda las semillas nuevas antes de cargar los anuncios editados.
    // Así se incorporan los viveros y mecánicos sin perder cambios previos.
    const localesPuente = this.negocios.filter(n => n.id >= 52 && n.id <= 65);
    const nuevosLocales = this.negocios.filter(n => n.id >= 34 && n.id <= 50);
    const claveMigracion = 'cerca_nuevos_locales_34_50_v1';
    try {
      const guardado = window.localStorage.getItem(this.claveEdicion);
      if (guardado) {
        const datos: unknown = JSON.parse(guardado);
        if (Array.isArray(datos) && datos.every((n: unknown) => this.negocioValido(n))) {
          this.negocios = datos as Negocio[];
        }
      }
      // Se ejecuta una sola vez: borrar un anuncio después no lo vuelve a crear.
      if (!window.localStorage.getItem(claveMigracion)) {
        const idsExistentes = new Set(this.negocios.map(n => n.id));
        const faltantes = nuevosLocales.filter(n => !idsExistentes.has(n.id));
        if (faltantes.length > 0) {
          this.negocios = [...this.negocios, ...faltantes];
          window.localStorage.setItem(this.claveEdicion, JSON.stringify(this.negocios));
        }
        window.localStorage.setItem(claveMigracion, '1');
      }
      // Incorporación única de farmacias de Puente Alto a navegadores con anuncios guardados.
      const clavePuente = 'cerca_farmacias_puente_alto_v1';
      if (!window.localStorage.getItem(clavePuente)) {
        const fuentesPuente = localesPuente;
        const actuales = new Set(this.negocios.map(n =>
          n.nombre.trim().toLocaleLowerCase('es') + '|' + n.comuna.trim().toLocaleLowerCase('es')));
        let nuevoId = Math.max(51, ...this.negocios.map(n => n.id));
        const faltantes = fuentesPuente.filter(n =>
          !actuales.has(n.nombre.trim().toLocaleLowerCase('es') + '|' + n.comuna.trim().toLocaleLowerCase('es')))
          .map(n => ({ ...n, id: ++nuevoId }));
        if (faltantes.length) {
          this.negocios = [...this.negocios, ...faltantes];
          window.localStorage.setItem(this.claveEdicion, JSON.stringify(this.negocios));
        }
        window.localStorage.setItem(clavePuente, '1');
      }
      // Actualización de destacados, una vez por navegador sin sobrescribir cambios posteriores.
      const claveDestacados = 'cerca_farmacias_destacadas_v1';
      if (!window.localStorage.getItem(claveDestacados)) {
        let actualizar = false;
        const normalizar = (s: string): string => s.trim().toLocaleLowerCase('es');
        let farmacenter = this.negocios.find(n => normalizar(n.nombre) === 'farmacenter' && normalizar(n.comuna) === 'la florida');
        if (!farmacenter) {
          // Si ID 51 ya lo usa un anuncio creado por el usuario, asigna uno nuevo.
          const nuevoId = this.negocios.some(n => n.id === 51)
            ? Math.max(51, ...this.negocios.map(n => n.id)) + 1 : 51;
          farmacenter = {
            id: nuevoId, nombre: 'Farmacenter', categoria: 'Farmacias', comuna: 'La Florida',
            descripcion: 'Farmacia de Vicuña Mackenna. Foto genérica ilustrativa; verificar datos antes de publicar.',
            direccion: 'Av. Vicuña Mackenna 6650, Local 2',
            foto: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
            icono: '💊', origen: 'captura', destacado: true, prioridadDestacado: 2
          };
          this.negocios.push(farmacenter);
          actualizar = true;
        }
        for (const n of this.negocios) {
          const vecinal = n.id === 45 && n.comuna === 'La Florida' && n.categoria === 'Farmacias';
          const centro = normalizar(n.nombre) === 'farmacenter' && normalizar(n.comuna) === 'la florida';
          if (!vecinal && !centro) continue;
          if (n.destacado === undefined) { n.destacado = true; actualizar = true; }
          if (n.prioridadDestacado === undefined) {
            n.prioridadDestacado = vecinal ? 1 : 2; actualizar = true;
          }
          if (vecinal && n.direccion === 'Av. Vicuña Mackenna Poniente 6690') {
            n.direccion = 'Av. Vicuña Mackenna Poniente 6690, Local 12'; actualizar = true;
          }
        }
        if (actualizar) window.localStorage.setItem(this.claveEdicion, JSON.stringify(this.negocios));
        window.localStorage.setItem(claveDestacados, '1');
      }
      // Actualización masiva parcial del catálogo desde fuentes públicas, 18-10-2026.
      // Nunca activa WhatsApp desde un teléfono genérico ni sobrescribe horarios editados.
      const claveRevision = 'cerca_fuentes_publicas_20261018_v1';
      if (!window.localStorage.getItem(claveRevision)) {
        const actualizaciones: { nombre: string; comuna: string; horario?: string; telefono?: string; direccion?: string; fuente: string }[] = [
          { nombre: "Café del Jardín", comuna: "La Florida", horario: "Lun–Vie 18:00–21:00; sáb–dom cerrado (publicado; confirmar)", telefono: "+56 9 5879 0169", fuente: "https://es.restaurantguru.com/Cafe-del-Jardin-La-Florida-2" },
          { nombre: "KABI Pastelería y Cafetería", comuna: "La Florida", telefono: "+56 9 3647 0275", fuente: "Ficha pública del negocio en resultados de mapas" },
          { nombre: "La Duquesa Bakery", comuna: "La Florida", telefono: "+56 9 6130 1176", fuente: "Ficha pública del negocio en resultados de mapas" },
          { nombre: "Cafetería del Rey Brujo", comuna: "La Florida", fuente: "Ficha pública del negocio en resultados de mapas" },
          { nombre: "Farmacia Arapharma", comuna: "La Florida", horario: "Lun–Vie 11:00–19:00; sáb–dom cerrado (publicado; confirmar)", fuente: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida" },
          { nombre: "Farmacias Económicas", comuna: "La Florida", horario: "Lun–Sáb 10:00–20:00; dom cerrado (publicado; confirmar)", fuente: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida" },
          { nombre: "Farmacia Vecinal", comuna: "La Florida", fuente: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida" },
          { nombre: "Farmacenter", comuna: "La Florida", fuente: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida" },
          { nombre: "Farmacia El Químico", comuna: "La Florida", horario: "Lun–Jue 10:00–20:00; vie 10:00–14:00; sáb 10:00–19:00; dom 11:00–19:00 (publicado; confirmar)", fuente: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida" },
          { nombre: "Farmacia BarrioFlorida", comuna: "La Florida", fuente: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida" },
          { nombre: "Eco Farmacias", comuna: "La Florida", horario: "Lun–Vie 09:00–19:00; sáb 10:00–14:00; dom cerrado (publicado; confirmar)", direccion: "Serafín Zamora 29, Local 19", fuente: "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida" },
          { nombre: "Farmacias Titán 24/7", comuna: "Puente Alto", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacia Solidaria", comuna: "Puente Alto", horario: "Lun, mié–vie 09:00–14:00 y 15:00–18:00; mar 09:00–14:00 y 15:00–22:00; sáb 09:00–14:00; dom cerrado (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacia Roubillard S.A.", comuna: "Puente Alto", horario: "Lun–Vie 09:30–14:00 y 15:30–21:00; sáb–dom cerrado (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farma Ulloa", comuna: "Puente Alto", horario: "Lun–Sáb 09:00–21:00; dom cerrado (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacia San Carlos", comuna: "Puente Alto", horario: "Lun–Vie 09:00–16:30 y 17:00–21:00; sáb 10:00–16:30; dom cerrado (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacia Netfarma", comuna: "Puente Alto", horario: "Lun–Vie 10:30–14:30 y 16:30–22:00; sáb–dom cerrado (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacias La Botika", comuna: "Puente Alto", horario: "Lun–Sáb 10:00–14:00 y 17:00–21:00; dom cerrado (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacias Olímpica - Puente Alto", comuna: "Puente Alto", horario: "Lun–Sáb 09:00–15:00 y 17:00–20:00; dom cerrado (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacias Cruz Verde", comuna: "Puente Alto", horario: "Lun–Vie 09:00–22:30; sáb 09:30–22:30; dom 10:30–21:30 (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacia Novasalud - Puente Alto", comuna: "Puente Alto", horario: "Lun–Vie 09:30–19:30; sáb–dom cerrado (publicado; confirmar)", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
          { nombre: "Farmacia Macarena", comuna: "Puente Alto", horario: "Lun–Vie 10:00–14:00 y 16:00–20:00; sáb 10:00–14:00; dom cerrado (publicado; confirmar)", direccion: "Nonato Coo 3923", fuente: "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto" },
        ];
        let modificados = false;
        const normal = (v: string): string => v.trim().toLocaleLowerCase('es');
        for (const cambio of actualizaciones) {
          const n = this.negocios.find(b => normal(b.nombre) === normal(cambio.nombre) && normal(b.comuna) === normal(cambio.comuna));
          if (!n || n.origen === 'manual') continue;
          let tocado = false;
          if (cambio.horario && !n.horario) { n.horario = cambio.horario; tocado = true; }
          if (cambio.telefono && !n.telefono) { n.telefono = cambio.telefono; tocado = true; }
          if (cambio.direccion && (n.direccion || '').toLowerCase().includes('por verificar')) { n.direccion = cambio.direccion; tocado = true; }
          if (cambio.direccion && n.nombre === 'Eco Farmacias' && n.direccion === 'Sargento Zamora 29, local 19') { n.direccion = cambio.direccion; tocado = true; }
          if (tocado) { n.fuenteRevision = cambio.fuente; n.fechaRevision = '2026-10-18'; modificados = true; }
        }
        if (modificados) window.localStorage.setItem(this.claveEdicion, JSON.stringify(this.negocios));
        window.localStorage.setItem(claveRevision, '1');
      }
    } catch {
      this.avisoAdministracion = 'No se pudieron cargar o actualizar los anuncios guardados en el navegador.';
    }
    // Migración pública adicional, solo una vez, para anuncios locales de versiones anteriores.
    // Conserva los datos editados por el administrador y no reactiva registros eliminados.
    try {
      const claveFichas = 'cerca_integracion_fichas_publicas_20261018_v2';
      if (!window.localStorage.getItem(claveFichas)) {
        const cambiosPublicos: Array<{nombre:string; comuna:string; horario?:string;
          telefono?:string; direccion?:string; fuente?:string; nota?:string}> = [
    {
        "nombre": "Café del Jardín",
        "comuna": "La Florida",
        "horario": "Lun–Vie 18:00–21:00; sáb–dom cerrado (publicado; confirmar)",
        "telefono": "+56 9 5879 0169",
        "fuente": "https://es.restaurantguru.com/Cafe-del-Jardin-La-Florida-2",
        "nota": "Teléfono y horario coinciden con directorios independientes."
    },
    {
        "nombre": "KABI Pastelería y Cafetería",
        "comuna": "La Florida",
        "telefono": "+56 9 3647 0275",
        "fuente": "Ficha pública del negocio en resultados de mapas",
        "nota": "Horarios inconsistentes entre fuentes; no rellenar."
    },
    {
        "nombre": "La Duquesa Bakery",
        "comuna": "La Florida",
        "telefono": "+56 9 6130 1176",
        "fuente": "Ficha pública del negocio en resultados de mapas",
        "nota": "Horario sin confirmar por el local."
    },
    {
        "nombre": "Cafetería del Rey Brujo",
        "comuna": "La Florida",
        "fuente": "Ficha pública del negocio en resultados de mapas",
        "nota": "Horario por confirmar en el local."
    },
    {
        "nombre": "Farmacia Arapharma",
        "comuna": "La Florida",
        "horario": "Lun–Vie 11:00–19:00; sáb–dom cerrado (publicado; confirmar)",
        "fuente": "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida"
    },
    {
        "nombre": "Farmacias Económicas",
        "comuna": "La Florida",
        "horario": "Lun–Sáb 10:00–20:00; dom cerrado (publicado; confirmar)",
        "fuente": "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida"
    },
    {
        "nombre": "Farmacia Vecinal",
        "comuna": "La Florida",
        "fuente": "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
        "nota": "Hay discrepancias de horarios y teléfonos entre directorios. No actualizar automáticamente esos campos."
    },
    {
        "nombre": "Farmacenter",
        "comuna": "La Florida",
        "fuente": "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
        "nota": "Los horarios se contradicen entre directorios públicos. No asignar un horario definitivo."
    },
    {
        "nombre": "Farmacia El Químico",
        "comuna": "La Florida",
        "horario": "Lun–Jue 10:00–20:00; vie 10:00–14:00; sáb 10:00–19:00; dom 11:00–19:00 (publicado; confirmar)",
        "fuente": "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida"
    },
    {
        "nombre": "Farmacia BarrioFlorida",
        "comuna": "La Florida",
        "fuente": "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
        "nota": "En el registro público se llama BARRIO FARMA en Rojas Magallanes 94 B. Confirmar identidad antes de cambiar nombre u horario."
    },
    {
        "nombre": "Eco Farmacias",
        "comuna": "La Florida",
        "horario": "Lun–Vie 09:00–19:00; sáb 10:00–14:00; dom cerrado (publicado; confirmar)",
        "direccion": "Serafín Zamora 29, Local 19",
        "fuente": "https://www.buscafarma.cl/farmacias-de-turno/metropolitana/la-florida",
        "nota": "Nombre de calle corregido usando registro público; solo cambia la dirección si aún es la anterior."
    },
    {
        "nombre": "Farmacias Titán 24/7",
        "comuna": "Puente Alto",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
        "nota": "La condición 24/7/urgencia puede variar. Confirmar el régimen permanente y turnos."
    },
    {
        "nombre": "Farmacia Solidaria",
        "comuna": "Puente Alto",
        "horario": "Lun, mié–vie 09:00–14:00 y 15:00–18:00; mar 09:00–14:00 y 15:00–22:00; sáb 09:00–14:00; dom cerrado (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    },
    {
        "nombre": "Farmacia Roubillard S.A.",
        "comuna": "Puente Alto",
        "horario": "Lun–Vie 09:30–14:00 y 15:30–21:00; sáb–dom cerrado (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    },
    {
        "nombre": "Farma Ulloa",
        "comuna": "Puente Alto",
        "horario": "Lun–Sáb 09:00–21:00; dom cerrado (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    },
    {
        "nombre": "Farmacia San Carlos",
        "comuna": "Puente Alto",
        "horario": "Lun–Vie 09:00–16:30 y 17:00–21:00; sáb 10:00–16:30; dom cerrado (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    },
    {
        "nombre": "Farmacia Netfarma",
        "comuna": "Puente Alto",
        "horario": "Lun–Vie 10:30–14:30 y 16:30–22:00; sáb–dom cerrado (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    },
    {
        "nombre": "Farmacias La Botika",
        "comuna": "Puente Alto",
        "horario": "Lun–Sáb 10:00–14:00 y 17:00–21:00; dom cerrado (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    },
    {
        "nombre": "Farmacias Olímpica - Puente Alto",
        "comuna": "Puente Alto",
        "horario": "Lun–Sáb 09:00–15:00 y 17:00–20:00; dom cerrado (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    },
    {
        "nombre": "Farmacias Cruz Verde",
        "comuna": "Puente Alto",
        "horario": "Lun–Vie 09:00–22:30; sáb 09:30–22:30; dom 10:30–21:30 (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto",
        "nota": "Sólo la sucursal Av. Concha y Toro 3955, no generalizar a toda la cadena."
    },
    {
        "nombre": "Farmacia Novasalud - Puente Alto",
        "comuna": "Puente Alto",
        "horario": "Lun–Vie 09:30–19:30; sáb–dom cerrado (publicado; confirmar)",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    },
    {
        "nombre": "Farmacia Macarena",
        "comuna": "Puente Alto",
        "horario": "Lun–Vie 10:00–14:00 y 16:00–20:00; sáb 10:00–14:00; dom cerrado (publicado; confirmar)",
        "direccion": "Nonato Coo 3923",
        "fuente": "https://buscafarma.cl/farmacias-de-turno/metropolitana/puente-alto"
    }
];
        let huboCambios = false;
        const normalizar = (v: string) => v.trim().toLocaleLowerCase('es');
        for (const cambio of cambiosPublicos) {
          const n = this.negocios.find(item => normalizar(item.nombre) === normalizar(cambio.nombre) &&
            normalizar(item.comuna) === normalizar(cambio.comuna) && item.origen !== 'manual');
          if (!n) continue;
          if (cambio.horario && !n.horario) { n.horario = cambio.horario; huboCambios = true; }
          if (cambio.telefono && !n.telefono) { n.telefono = cambio.telefono; huboCambios = true; }
          if (cambio.direccion &&
              ((n.nombre === 'Eco Farmacias' && normalizar(n.direccion || '') === normalizar('Sargento Zamora 29, local 19')) ||
              (n.direccion || '').toLowerCase().includes('por verificar'))) {
            n.direccion = cambio.direccion; huboCambios = true;
          }
          if (cambio.fuente && !n.fuenteRevision) { n.fuenteRevision = cambio.fuente; huboCambios = true; }
          if (cambio.nota && !n.observacionRevision) { n.observacionRevision = cambio.nota; huboCambios = true; }
          if (!n.fechaRevision) { n.fechaRevision = '2026-10-18'; huboCambios = true; }
        }
        if (huboCambios) window.localStorage.setItem(this.claveEdicion, JSON.stringify(this.negocios));
        window.localStorage.setItem(claveFichas, '1');
      }
    } catch {
      this.avisoAdministracion = 'No se pudieron incorporar todos los datos públicos al navegador.';
    }
    try {
      const datos = window.localStorage.getItem(this.claveCampanas);
      if (datos) {
        const configuracion: unknown = JSON.parse(datos);
        if (configuracion && typeof configuracion === 'object') {
          const p = configuracion as Record<string, unknown>;
          for (const f of this.frecuenciasCampana) {
            if (this.programacionValida(p[f], f)) this.configuracionCampanas[f] = {...p[f]};
          }
        }
      }
    } catch {
      this.mensajeCampanas = 'No se pudo recuperar la configuración de campañas.';
    }
  }

  @HostListener('window:hashchange')
  sincronizarPantalla(): void {
    if (typeof window !== 'undefined') {
      this.mostrarAdministracion = window.location.hash === '#admin';
      if (!this.mostrarAdministracion) this.formularioAbierto = false;
    }
  }

  get anunciosAdministracion(): Negocio[] {
    const busqueda = this.busquedaAdministracion.trim().toLocaleLowerCase('es');
    return this.negocios.filter(n => [n.nombre, n.categoria, n.comuna, n.direccion || '']
      .join(' ').toLocaleLowerCase('es').includes(busqueda))
      .sort((a, b) => Number(Boolean(b.destacado)) - Number(Boolean(a.destacado)) ||
        (a.prioridadDestacado ?? 100) - (b.prioridadDestacado ?? 100));
  }

  esDestacadoEnComuna(n: Negocio): boolean {
    return n.destacado === true && n.comuna === this.comuna;
  }

  alternarDestacado(negocio: Negocio): void {
    const anterior = this.negocios;
    this.negocios = this.negocios.map(n => n.id === negocio.id ? {
      ...n, destacado: n.destacado !== true, prioridadDestacado: n.prioridadDestacado ?? 100
    } : n);
    if (!this.persistir()) this.negocios = anterior;
  }

  get publicados(): number {
    return this.negocios.filter(n => n.publicado !== false).length;
  }

  get borradores(): number {
    return this.negocios.filter(n => n.publicado === false).length;
  }

  entrarAdministracion(): void {
    if (typeof window !== 'undefined') window.location.hash = 'admin';
    this.mostrarAdministracion = true;
    this.avisoAdministracion = '';
  }

  salirAdministracion(): void {
    this.formularioAbierto = false;
    this.mostrarAdministracion = false;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  private negocioValido(valor: unknown): boolean {
    if (typeof valor !== 'object' || valor === null) return false;
    const n = valor as Partial<Negocio>;
    return typeof n.id === 'number' && Number.isFinite(n.id) &&
      typeof n.nombre === 'string' && typeof n.categoria === 'string' &&
      typeof n.comuna === 'string' && typeof n.descripcion === 'string' &&
      typeof n.foto === 'string' && typeof n.icono === 'string';
  }

  private formularioVacio(): Negocio {
    return {
      id: 0, nombre: '', categoria: 'Cafés', comuna: 'La Florida', direccion: '',
      descripcion: '', foto: this.fotoPorCategoria('Cafés'), icono: '☕', publicado: true,
      destacado: false, prioridadDestacado: 100, whatsapp: '', sitioWeb: '', horario: ''
    };
  }

  private fotoPorCategoria(categoria: Negocio['categoria']): string {
    const fotos: Record<string, string> = {
      'Cafés': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900&q=85&fit=crop',
      'Panaderías': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=85&fit=crop',
      'Computación': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=85&fit=crop',
      'Viveros': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&q=85&fit=crop',
      'Farmacias': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=85&fit=crop',
      'Mecánicos': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop',
      'Peluquería': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=85&fit=crop',
      'Vulcanización': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=85&fit=crop',
      'Bares': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&q=85&fit=crop',
      'Mascotas': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900&q=85&fit=crop',
      'Tiendas': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=900&q=85&fit=crop',
      'Servicios': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=85&fit=crop'
    };
    return fotos[categoria] || fotos['Servicios'];
  }

  seleccionarFotoGenerica(): void {
    this.anuncioEditor.foto = this.fotoPorCategoria(this.anuncioEditor.categoria);
  }

  private iconoPorCategoria(categoria: Negocio['categoria']): string {
    return this.categorias.find(c => c.nombre === categoria)?.icono || '⌖';
  }

  nuevoAnuncio(): void {
    this.anuncioEditor = this.formularioVacio();
    this.errorFormulario = '';
    this.formularioAbierto = true;
  }

  editarAnuncio(negocio: Negocio): void {
    this.anuncioEditor = { ...negocio, publicado: negocio.publicado !== false };
    this.errorFormulario = '';
    this.formularioAbierto = true;
  }

  cancelarEdicion(): void {
    this.formularioAbierto = false;
    this.errorFormulario = '';
  }

  private persistir(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(this.claveEdicion, JSON.stringify(this.negocios));
      this.avisoAdministracion = 'Cambios guardados en este navegador.';
      return true;
    } catch {
      this.avisoAdministracion = 'No se pudo guardar. Revisa el espacio disponible o el modo privado.';
      return false;
    }
  }

  guardarAnuncio(): void {
    this.errorFormulario = '';
    const n = { ...this.anuncioEditor };
    n.nombre = (n.nombre || '').trim();
    n.comuna = (n.comuna || '').trim();
    n.descripcion = (n.descripcion || '').trim();
    n.direccion = (n.direccion || '').trim();
    n.foto = (n.foto || '').trim() || this.fotoPorCategoria(n.categoria);
    n.telefono = (n.telefono || '').trim();
    n.whatsapp = (n.whatsapp || '').trim();
    n.sitioWeb = (n.sitioWeb || '').trim();
    n.horario = (n.horario || '').trim();
    if (n.whatsapp && !/^\+?[0-9\s()\-]{9,22}$/.test(n.whatsapp)) {
      this.errorFormulario = 'WhatsApp: ingresa un número válido con código de país, ejemplo +569...';
      return;
    }
    if (n.sitioWeb && !this.webUrl(n)) {
      this.errorFormulario = 'La página web debe comenzar con https:// y ser válida.';
      return;
    }
    const tieneLat = n.latitud !== undefined && n.latitud !== null && String(n.latitud) !== '';
    const tieneLon = n.longitud !== undefined && n.longitud !== null && String(n.longitud) !== '';
    if (tieneLat !== tieneLon || (tieneLat && (
      !Number.isFinite(Number(n.latitud)) || !Number.isFinite(Number(n.longitud)) ||
      Math.abs(Number(n.latitud)) > 90 || Math.abs(Number(n.longitud)) > 180))) {
      this.errorFormulario = 'Indica latitud y longitud válidas juntas, o deja ambas vacías.';
      return;
    }
    if (tieneLat) { n.latitud = Number(n.latitud); n.longitud = Number(n.longitud); }
    else { delete n.latitud; delete n.longitud; }
    n.icono = this.iconoPorCategoria(n.categoria);
    n.prioridadDestacado = Number(n.prioridadDestacado ?? 100);
    if (!Number.isInteger(n.prioridadDestacado) || n.prioridadDestacado < 1 || n.prioridadDestacado > 999) {
      this.errorFormulario = 'Prioridad inválida: escribe un número del 1 al 999.';
      return;
    }
    if (!n.nombre || !n.comuna) {
      this.errorFormulario = 'Debes indicar nombre y comuna.';
      return;
    }
    if (!this.categorias.some(c => c.nombre === n.categoria)) {
      this.errorFormulario = 'Selecciona una categoría válida.';
      return;
    }
    // Solo se admiten imágenes remotas HTTPS o fotos comprimidas que suba el administrador.
    if (!(/^https:\/\//i.test(n.foto) || /^data:image\/(jpeg|png|webp);base64,/i.test(n.foto))) {
      this.errorFormulario = 'La imagen debe ser una URL HTTPS o una foto subida.';
      return;
    }
    const anterior = this.negocios.slice();
    if (n.id === 0) {
      n.id = Math.max(0, ...this.negocios.map(item => item.id)) + 1;
      n.origen = 'manual'; // Activa búsqueda por nombre sin inventar coordenadas.
      this.negocios = [n, ...this.negocios];
    } else {
      this.negocios = this.negocios.map(item => item.id === n.id ? n : item);
    }
    if (this.persistir()) {
      this.formularioAbierto = false;
    } else {
      this.negocios = anterior;
      this.errorFormulario = 'No se aplicaron los cambios porque no se pudieron guardar.';
    }
  }

  cambiarPublicacion(negocio: Negocio): void {
    const anterior = this.negocios.slice();
    this.negocios = this.negocios.map(n => n.id === negocio.id ? { ...n, publicado: n.publicado === false } : n);
    if (!this.persistir()) this.negocios = anterior;
  }

  eliminarAnuncio(negocio: Negocio): void {
    if (typeof window === 'undefined' || !window.confirm(`¿Eliminar el anuncio "${negocio.nombre}"?`)) return;
    const anterior = this.negocios.slice();
    this.negocios = this.negocios.filter(n => n.id !== negocio.id);
    if (!this.persistir()) this.negocios = anterior;
  }

  exportarAnuncios(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const archivo = new Blob([JSON.stringify(this.negocios, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'cerca-respaldo-anuncios.json';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  // Comprime la foto subida antes de guardarla, para reducir el consumo de almacenamiento local.
  cargarFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.errorFormulario = 'Elige una imagen JPG, PNG o WebP.';
      input.value = '';
      return;
    }
    if (archivo.size > 8 * 1024 * 1024) {
      this.errorFormulario = 'La fotografía no puede superar 8 MB.';
      input.value = '';
      return;
    }
    this.guardandoFoto = true;
    const lector = new FileReader();
    lector.onerror = () => {
      this.errorFormulario = 'No se pudo leer la imagen.';
      this.guardandoFoto = false;
    };
    lector.onload = () => {
      const imagen = new Image();
      imagen.onload = () => {
        const escala = Math.min(1, 850 / Math.max(imagen.width, imagen.height));
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.max(1, Math.round(imagen.width * escala));
        lienzo.height = Math.max(1, Math.round(imagen.height * escala));
        const contexto = lienzo.getContext('2d');
        if (!contexto) { this.errorFormulario = 'No se pudo procesar la fotografía.'; this.guardandoFoto = false; return; }
        contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        this.anuncioEditor.foto = lienzo.toDataURL('image/jpeg', 0.72);
        this.guardandoFoto = false;
        this.errorFormulario = '';
      };
      imagen.onerror = () => { this.errorFormulario = 'Imagen inválida.'; this.guardandoFoto = false; };
      imagen.src = String(lector.result || '');
    };
    lector.readAsDataURL(archivo);
    input.value = '';
  }


  // Geolocalización voluntaria, actualizada cuando la persona se desplaza.
  activarGPS(): void {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.estadoGPS = 'Este navegador no permite ubicación.';
      return;
    }
    if (this.gpsWatchId !== null) return;
    this.estadoGPS = 'Solicitando permiso de ubicación…';
    this.gpsWatchId = navigator.geolocation.watchPosition(
      posicion => {
        this.posicionActual = {
          lat: posicion.coords.latitude,
          lon: posicion.coords.longitude
        };
        this.gpsHabilitado = true;
        this.estadoGPS = 'Ubicación activa · distancias actualizadas al desplazarte.';
      },
      error => {
        this.estadoGPS = error.code === 1
          ? 'Ubicación no autorizada. Puedes seguir buscando por comuna.'
          : 'No se pudo obtener tu ubicación. Puedes seguir buscando por comuna.';
        this.detenerGPS();
      },
      { enableHighAccuracy: false, maximumAge: 20000, timeout: 15000 }
    );
  }

  detenerGPS(): void {
    if (this.gpsWatchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.gpsWatchId);
    }
    this.gpsWatchId = null;
    this.gpsHabilitado = false;
    this.posicionActual = null;
  }

  ngOnDestroy(): void { this.detenerGPS(); }

  distanciaReal(n: Negocio): number | null {
    if (!this.posicionActual || typeof n.latitud !== 'number' || typeof n.longitud !== 'number' ||
      !Number.isFinite(n.latitud) || !Number.isFinite(n.longitud) ||
      Math.abs(n.latitud) > 90 || Math.abs(n.longitud) > 180) return null;
    const rad = Math.PI / 180;
    const lat1 = this.posicionActual.lat * rad;
    const lat2 = n.latitud * rad;
    const dLat = (n.latitud - this.posicionActual.lat) * rad;
    const dLon = (n.longitud - this.posicionActual.lon) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  distanciaTexto(n: Negocio): string {
    const km = this.distanciaReal(n);
    return km === null ? 'Km por confirmar' : `${km.toLocaleString('es-CL', { maximumFractionDigits: 1 })} km aprox.`;
  }

  whatsappUrl(n: Negocio): string | null {
    const digitos = (n.whatsapp || '').replace(/\D/g, '');
    // No se inventan números ni se genera un vínculo inválido.
    if (digitos.length < 9 || digitos.length > 15) return null;
    return `https://wa.me/${digitos}?text=${encodeURIComponent('Hola, encontré tu negocio en CERCA.cl y quisiera consultar.')}`;
  }

  webUrl(n: Negocio): string | null {
    const url = (n.sitioWeb || '').trim();
    if (!/^https:\/\//i.test(url)) return null;
    try {
      const valida = new URL(url);
      if (valida.protocol !== 'https:') return null;
      return valida.toString();
    } catch { return null; }
  }

  telefonoUrl(n: Negocio): string | null {
    const original = (n.telefono || '').trim();
    const digitos = original.replace(/\D/g, '');
    return digitos.length >= 8 && digitos.length <= 15
      ? 'tel:' + (original.startsWith('+') ? '+' : '') + digitos
      : null;
  }

  fuentePublicaUrl(n: Negocio): string | null {
    const fuente = (n.fuenteRevision || '').trim();
    if (!/^https:\/\//i.test(fuente)) return null;
    try {
      const u = new URL(fuente);
      return u.protocol === 'https:' ? u.toString() : null;
    } catch { return null; }
  }

  puntuacionTexto(n: Negocio): string {
    return typeof n.calificacion === 'number' && n.calificacion >= 0 && n.calificacion <= 5
      ? `${n.calificacion.toLocaleString('es-CL', { maximumFractionDigits: 1 })}/5${n.datosVerificados === true ? '' : ' · muestra'}`
      : 'Sin calificación';
  }

  get negociosFiltrados(): Negocio[] {
    const texto = this.busqueda.trim().toLocaleLowerCase('es');
    return this.negocios.filter((negocio) => {
      if (negocio.publicado === false) return false;
      const coincideCategoria = this.categoriaActiva === 'Todos' || negocio.categoria === this.categoriaActiva;
      const coincideComuna = negocio.comuna === this.comuna;
      const km = this.distanciaReal(negocio);
      const coincideDistancia = this.distanciaMaxima === 999 || km === null || km <= this.distanciaMaxima;
      const coincideTexto = [negocio.nombre, negocio.categoria, negocio.descripcion, negocio.comuna, negocio.direccion || '']
        .join(' ').toLocaleLowerCase('es').includes(texto);
      const coincideFavorito = !this.mostrarSoloFavoritos || this.favoritos.has(negocio.id);
      return coincideCategoria && coincideComuna && coincideDistancia && coincideTexto && coincideFavorito;
    }).sort((a, b) => {
      const primero = Number(this.esDestacadoEnComuna(b)) - Number(this.esDestacadoEnComuna(a));
      if (primero) return primero;
      if (this.esDestacadoEnComuna(a) && this.esDestacadoEnComuna(b)) {
        return (a.prioridadDestacado ?? 100) - (b.prioridadDestacado ?? 100);
      }
      const distA = this.distanciaReal(a);
      const distB = this.distanciaReal(b);
      if (distA !== null && distB !== null) return distA - distB;
      return 0;
    });
  }

  // Solo los pines de demostración tienen coordenadas; los nuevos no usan posiciones inventadas.
  get negociosConPinDemo(): Negocio[] {
    return this.negociosFiltrados.filter(n => n.pinX != null && n.pinY != null);
  }

  enlaceMapa(negocio: Negocio): string {
    const consulta = [negocio.nombre, negocio.direccion, negocio.comuna, 'Santiago', 'Chile']
      .filter(Boolean).join(' ');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(consulta);
  }

  get cantidadFavoritos(): number {
    return this.favoritos.size;
  }

  buscar(): void {
    this.irA('explorar');
  }

  seleccionarCategoria(categoria: Categoria): void {
    this.categoriaActiva = categoria;
    this.mostrarSoloFavoritos = false;
    this.irA('explorar');
  }

  alternarFavorito(id: number): void {
    if (this.favoritos.has(id)) {
      this.favoritos.delete(id);
    } else {
      this.favoritos.add(id);
    }
  }

  esFavorito(id: number): boolean {
    return this.favoritos.has(id);
  }

  alternarVistaFavoritos(): void {
    this.mostrarSoloFavoritos = !this.mostrarSoloFavoritos;
    this.irA('explorar');
  }

  abrirDetalle(negocio: Negocio): void {
    this.negocioSeleccionado = negocio;
    this.mostrarPublicacion = false;
  }

  abrirPublicacion(): void {
    this.negocioSeleccionado = null;
    this.mostrarPublicacion = true;
    this.menuAbierto = false;
  }

  cerrarModal(): void {
    this.negocioSeleccionado = null;
    this.mostrarPublicacion = false;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.comuna = 'La Florida';
    this.categoriaActiva = 'Todos';
    this.distanciaMaxima = 999;
    this.mostrarSoloFavoritos = false;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  irA(id: string): void {
    this.menuAbierto = false;
    if (typeof document === 'undefined') {
      return;
    }

    const destino = document.getElementById(id);
    if (!destino) {
      return;
    }

    destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  trackById(_index: number, negocio: Negocio): number {
    return negocio.id;
  }
}
