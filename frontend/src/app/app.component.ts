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
  recomendacionEditorial?: boolean; // 5.0 recomendado por una persona; NO promedio de reseñas.
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


// Telemetría de prueba, local y sin datos personales. Requiere API para uso global.
type TipoEventoCerca = 'visita' | 'busqueda' | 'categoria' | 'ficha' | 'whatsapp' |
  'web' | 'ruta' | 'telefono' | 'favorito' | 'suscripcion' | 'gps' | 'campana';
interface EventoCerca {
  fecha: string;
  tipo: TipoEventoCerca;
  negocioId?: number;
  comuna?: string;
  categoria?: string;
}
interface OpinionCerca {
  id: string;
  negocioId: number;
  dispositivo: string;
  estrellas: number;
  motivos: string[];
  comentario: string;
  fecha: string;
  estado: 'pendiente' | 'resuelto';
  respuesta: string;
}
interface FilaMetrica { nombre: string; valor: number; porcentaje: number; }
interface BarraMetrica { etiqueta: string; valor: number; alto: number; }

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

  // Catálogo interno del círculo "Oficios y Profesiones".
  mostrarPanelOficios = false;
  oficioSeleccionado: string | null = null;
  readonly oficiosYProfesiones: { nombre: string; icono: string; palabras: string[] }[] = [
    { nombre: 'Mecánicos', icono: '🚗', palabras: ['mecanic', 'automotriz'] },
    { nombre: 'Gasfíteres', icono: '🚰', palabras: ['gasfiter', 'plomer', 'fontaner'] },
    { nombre: 'Electricistas', icono: '💡', palabras: ['electricist', 'electricidad'] },
    { nombre: 'Cerrajeros', icono: '🔑', palabras: ['cerrajer', 'cerradur'] },
    { nombre: 'Carpinteros', icono: '🪚', palabras: ['carpinter'] },
    { nombre: 'Pintores', icono: '🖌️', palabras: ['pintor', 'pintura de casas'] },
    { nombre: 'Jardineros', icono: '🌱', palabras: ['jardiner', 'paisajism'] },
    { nombre: 'Maestros', icono: '🔨', palabras: ['maestro', 'albanil', 'construccion'] },
    { nombre: 'Veterinarios', icono: '🐾', palabras: ['veterinari'] },
    { nombre: 'Contadores', icono: '🧮', palabras: ['contador', 'contabil', 'contable'] },
    { nombre: 'Abogados', icono: '⚖️', palabras: ['abogad', 'asesoria legal'] },
    { nombre: 'Arquitectos', icono: '📐', palabras: ['arquitect'] },
    { nombre: 'Psicólogos', icono: '🧠', palabras: ['psicolog'] },
    { nombre: 'Profesores particulares', icono: '🎓', palabras: ['profesor particular', 'clases particulares', 'tutorias'] },
    { nombre: 'Técnicos informáticos', icono: '💻', palabras: ['informatic', 'computacion', 'computador', 'soporte tecnico'] },
    { nombre: 'Soldadores', icono: '🔥', palabras: ['soldador', 'soldadura'] },
    { nombre: 'Refrigeración', icono: '❄️', palabras: ['refrigeracion', 'aire acondicionado'] },
    { nombre: 'Técnicos en celulares', icono: '📱', palabras: ['celular', 'smartphone'] },
    { nombre: 'Fotógrafos', icono: '📷', palabras: ['fotograf'] },
    { nombre: 'Diseñadores gráficos', icono: '🎨', palabras: ['disenador grafico', 'diseno grafico'] },
    { nombre: 'Kinesiólogos', icono: '🦴', palabras: ['kinesiolog'] },
    { nombre: 'Nutricionistas', icono: '🥑', palabras: ['nutricionist'] },
    { nombre: 'Fletes y mudanzas', icono: '🚚', palabras: ['flete', 'mudanza', 'transportista'] },
    { nombre: 'Costureras y sastres', icono: '🧵', palabras: ['costurer', 'sastrer', 'modist'] },
    { nombre: 'Cuidadores', icono: '🤝', palabras: ['cuidador', 'cuidado domiciliario'] }
  ];

  abrirPanelOficios(): void {
    this.mostrarPanelOficios = true;
    this.oficioSeleccionado = null;
  }

  cerrarPanelOficios(): void {
    this.mostrarPanelOficios = false;
    this.oficioSeleccionado = null;
  }

  filtrarOficio(nombre: string): void {
    this.oficioSeleccionado = nombre;
    this.categoriaActiva = 'Todos';
    this.categoriasIntencion = null;
    this.consultaActiva = '';
    this.busqueda = '';
    this.mostrarSoloFavoritos = false;
    this.registrarEvento('categoria');
    this.irA('explorar');
  }

  private negocioDeOficio(negocio: Negocio, nombre: string): boolean {
    const oficio = this.oficiosYProfesiones.find(item => item.nombre === nombre);
    if (!oficio) return false;
    const texto = [negocio.nombre, negocio.categoria, negocio.descripcion]
      .filter(Boolean).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return oficio.palabras.some(palabra => texto.includes(palabra));
  }

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

  // Entrada centrada en necesidad y descubrimiento. No envía WhatsApp ni publica solicitudes.
  modoEntrada: 'necesito' | 'descubrir' = 'necesito';
  entradaTexto = '';
  errorEntrada = '';
  consultaActiva = '';
  categoriasIntencion: Categoria[] | null = null;
  readonly sugerenciasNecesito = [
    { icono: '🥖', etiqueta: 'Comprar pan', texto: 'Necesito comprar pan' },
    { icono: '🚗', etiqueta: 'Cambiar una rueda', texto: 'Necesito cambiar una rueda' },
    { icono: '📚', etiqueta: 'Papel lustre', texto: 'Necesito papel lustre' },
    { icono: '🔧', etiqueta: 'Reparación del hogar', texto: 'Necesito un gasfíter' }
  ];
  readonly sugerenciasDescubrir = [
    { icono: '☕', etiqueta: 'Tomar un café', texto: 'Quiero tomar un café' },
    { icono: '🍰', etiqueta: 'Algo dulce', texto: 'Se me antoja algo dulce' },
    { icono: '🍔', etiqueta: 'Tengo hambre', texto: 'Tengo hambre' },
    { icono: '🎵', etiqueta: 'Salir un rato', texto: 'Quiero salir un rato' }
  ];
  get sugerenciasEntrada() {
    return this.modoEntrada === 'necesito' ? this.sugerenciasNecesito : this.sugerenciasDescubrir;
  }

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
  accesoConcedido = true; // El directorio es público: no condicionar acceso a recibir publicidad.
  accesoRechazado = false;
  decisionSuscripcion: 'pendiente' | 'si' | 'no' = 'pendiente';
  private readonly claveDecisionVisitante = 'cerca_visitante_optin_v1';

  frecuenciaSuscripcion: Exclude<FrecuenciaCampana, 'anual'> = 'semanal';
  tipoPromociones = true;
  tipoActualizaciones = true;
  canalSuscripcion: CanalCampana = 'email';
  comunaSuscripcion = 'La Florida';
  nombreSuscripcion = '';
  contactoSuscripcion = '';
  consentimientoSuscripcion = false;
  errorSuscripcion = '';
  avisoSuscripcion = '';
  intencionSuscripcion: 'ahora' | 'pronto' | 'explorando' = 'pronto';
  interesesSuscripcion: string[] = ['Cafés'];
  procesandoSuscripcion = false;
  tokenBajaSuscripcion = '';
  reputacionPorNegocio:Record<number,{promedio:number;total:number}> = {};
  apiDisponible = false;
  apiError = 'Conectando CERCA con PostgreSQL…';
  accesoAdmin = false;
  adminPassword = '';
  adminToken = '';
  errorAdminLogin = '';
  resumenGlobal: {negocios:number;eventos:Record<string,number>;suscripciones:Record<string,number>;reputacion:any}|null=null;
  suscriptoresAdmin: Array<{id:number;nombre:string;canal:string;contacto:string;comuna:string;intereses:string[];intencion:string;frecuencia:string;estado:string;contenido:string;consentimiento_en:string}> = [];
  filtroInteresAdmin = '';
  filtroIntencionAdmin = '';
  filtroEstadoAdmin = '';
  filtroComunaAdmin = '';
  filtroFrecuenciaAdmin = '';
  cargandoAdmin = false;
  alternarInteres(rubro:string):void {
    this.interesesSuscripcion = this.interesesSuscripcion.includes(rubro) ?
      this.interesesSuscripcion.filter(x=>x!==rubro) : [...this.interesesSuscripcion,rubro];
  }

  private async api<T>(ruta:string, opciones:RequestInit={}):Promise<T> {
    const headers=new Headers(opciones.headers||{});
    headers.set('Content-Type','application/json');
    if(this.adminToken)headers.set('Authorization','Bearer '+this.adminToken);
    let res:Response;
    try {res=await fetch('/api'+ruta,{...opciones,headers,cache:'no-store'});}
    catch {throw Error('No se puede conectar con el servidor CERCA. Inicia PostgreSQL y la API.');}
    if(!res.ok){
      let msg='Error del servidor '+res.status;
      try{const body=await res.json();msg=body.error||msg;}catch{}
      if(res.status===401){this.accesoAdmin=false;this.adminToken='';}
      throw Error(msg);
    }
    return res.json() as Promise<T>;
  }
  private async iniciarServidor():Promise<void> {
    try {
      const negocios=await this.api<Negocio[]>('/negocios');
      this.negocios=negocios;
      const [opiniones,reputacion]=await Promise.all([
        this.api<OpinionCerca[]>('/reputacion'),
        this.api<Record<number,{promedio:number;total:number}>>('/reputacion/resumen')]);
      this.opinionesCerca=opiniones;this.reputacionPorNegocio=reputacion;
      this.apiDisponible=true;this.apiError='';
      if(this.visitaPendiente){this.visitaPendiente=false;this.registrarEvento('visita');}
    }catch(e){this.apiDisponible=false;this.apiError=(e as Error).message;}
  }
  async loginAdmin():Promise<void> {
    this.errorAdminLogin='';
    try {
      const sesion=await this.api<{token:string}>('/admin/login',{method:'POST',body:JSON.stringify({password:this.adminPassword})});
      this.adminPassword='';this.adminToken=sesion.token;this.accesoAdmin=true;
      await this.cargarAdmin();
    }catch(e){this.errorAdminLogin=(e as Error).message;}
  }
  salirSesionAdmin():void {this.adminToken='';this.accesoAdmin=false;this.resumenGlobal=null;this.suscriptoresAdmin=[];}
  async cargarAdmin():Promise<void> {
    if(!this.accesoAdmin)return;
    this.cargandoAdmin=true;
    try {
      const [negocios,eventos,opiniones,resumen,campanas,suscriptores]=await Promise.all([
        this.api<Negocio[]>('/admin/negocios'),
        this.api<EventoCerca[]>('/admin/eventos?limit=5000'),
        this.api<OpinionCerca[]>('/admin/opiniones'),
        this.api<any>('/admin/resumen?periodo='+this.periodoTablero+'&comuna='+encodeURIComponent(this.comunaTablero)+'&categoria='+encodeURIComponent(this.categoriaTablero)),
        this.api<Record<string,ProgramacionCampana>>('/admin/campanas'),
        this.api<typeof this.suscriptoresAdmin>('/admin/suscriptores')]);
      this.negocios=negocios;this.eventos=eventos;this.opinionesCerca=opiniones;
      this.resumenGlobal=resumen;
      this.suscriptoresAdmin=suscriptores;
      for(const f of this.frecuenciasCampana){if(campanas[f]&&this.programacionValida(campanas[f],f))this.configuracionCampanas[f]=campanas[f];}
      this.apiDisponible=true;this.apiError='';
    }catch(e){this.avisoAdministracion=(e as Error).message;}
    finally{this.cargandoAdmin=false;}
  }
  async actualizarResumen():Promise<void> {
    if(!this.accesoAdmin)return;
    try{this.resumenGlobal=await this.api<any>('/admin/resumen?periodo='+this.periodoTablero+
      '&comuna='+encodeURIComponent(this.comunaTablero)+'&categoria='+encodeURIComponent(this.categoriaTablero));}
    catch(e){this.avisoAdministracion=(e as Error).message;}
  }
  get suscriptoresFiltrados(): typeof this.suscriptoresAdmin {
    return this.suscriptoresAdmin.filter(s=>(!this.filtroInteresAdmin||s.intereses.includes(this.filtroInteresAdmin))&&
    (!this.filtroIntencionAdmin||s.intencion===this.filtroIntencionAdmin)&&
    (!this.filtroEstadoAdmin||s.estado===this.filtroEstadoAdmin)&&
    (!this.filtroComunaAdmin||s.comuna===this.filtroComunaAdmin)&&
    (!this.filtroFrecuenciaAdmin||s.frecuencia===this.filtroFrecuenciaAdmin));
  }
  get suscriptoresConfirmados():number{return Number(this.resumenGlobal?.suscripciones?.['confirmado']||0);}
  async importarDatosLocales():Promise<void> {
    if(typeof window==='undefined'||!this.accesoAdmin)return;
    const bruto=window.localStorage.getItem(this.claveEdicion);
    if(!bruto){this.avisoAdministracion='No hay anuncios antiguos en este navegador para importar.';return;}
    if(!window.confirm('Esto reemplazará fichas del mismo ID en PostgreSQL con tus datos antiguos de ESTE navegador. Haz antes una copia de seguridad. ¿Continuar?'))return;
    try{const lista=JSON.parse(bruto);if(!Array.isArray(lista))throw Error('Datos inválidos.');
      const resultado=await this.api<{importados:number}>('/admin/importar',{method:'POST',body:JSON.stringify({negocios:lista})});
      await this.cargarAdmin();this.avisoAdministracion=resultado.importados+' fichas importadas al servidor.';
    }catch(e){this.avisoAdministracion=(e as Error).message;}
  }


  abrirSuscripcion(): void {
    this.mostrarSuscripcion = true;
    this.comunaSuscripcion = this.comuna;
    this.errorSuscripcion = '';
    this.avisoSuscripcion = '';
    // Una visita posterior puede consultar las preferencias sin registrar de nuevo.
    // Respeta la decisión previa; a un nuevo visitante le pregunta Sí o No.
    // Nunca bloquea la navegación pública.
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
      this.accesoConcedido = true;
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

  async validarSuscripcion(): Promise<void> {
    this.errorSuscripcion = '';this.avisoSuscripcion = '';
    if (this.decisionSuscripcion !== 'si')return;
    if (!this.tipoPromociones&&!this.tipoActualizaciones){this.errorSuscripcion='Selecciona qué deseas recibir.';return;}
    if (!this.interesesSuscripcion.length){this.errorSuscripcion='Elige al menos un rubro que te interese.';return;}
    if (!this.consentimientoSuscripcion){this.errorSuscripcion='Para suscribirte debes aceptar recibir estas comunicaciones.';return;}
    const contacto=this.contactoSuscripcion.trim(),num=contacto.replace(/\D/g,'');
    if(this.nombreSuscripcion.trim().length<2){this.errorSuscripcion='Ingresa tu nombre.';return;}
    if(this.canalSuscripcion==='email'?!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto):!/^569\d{8}$/.test(num)){
      this.errorSuscripcion='Ingresa un correo o WhatsApp válido (+56 9 XXXX XXXX).';return;
    }
    this.procesandoSuscripcion=true;
    try {
      const datos={nombre:this.nombreSuscripcion.trim(),canal:this.canalSuscripcion,contacto,comuna:this.comunaSuscripcion,
        intereses:this.interesesSuscripcion,intencion:this.intencionSuscripcion,frecuencia:this.frecuenciaSuscripcion,
        contenido:this.tipoPromociones&&this.tipoActualizaciones?'ambas':this.tipoPromociones?'promociones':'actualizaciones',
        consentimiento:true,sitio_web_oculto:''};
      const resultado=await this.api<{estado:string;mensaje:string;tokenBaja:string}>('/suscripciones',{method:'POST',body:JSON.stringify(datos)});
      this.tokenBajaSuscripcion=resultado.tokenBaja;
      if(typeof window!=='undefined')window.localStorage.setItem('cerca_token_baja_v1',resultado.tokenBaja);
      this.accesoConcedido=true;this.accesoRechazado=false;this.guardarDecisionLocal('si');
      this.mostrarSuscripcion=false;this.nombreSuscripcion='';this.contactoSuscripcion='';this.consentimientoSuscripcion=false;
      this.avisoSuscripcion=resultado.mensaje;
      this.registrarEvento('suscripcion');
    }catch(e){this.errorSuscripcion=(e as Error).message;}
    finally{this.procesandoSuscripcion=false;}
  }
  async solicitarBaja():Promise<void> {
    const token=this.tokenBajaSuscripcion||(typeof window!=='undefined'?window.localStorage.getItem('cerca_token_baja_v1')||'':'');
    if(!token){this.errorSuscripcion='No existe un token de baja en este dispositivo. Contacta al administrador.';return;}
    try{await this.api('/suscripciones/baja',{method:'POST',body:JSON.stringify({token})});
      if(typeof window!=='undefined')window.localStorage.removeItem('cerca_token_baja_v1');
      this.tokenBajaSuscripcion='';this.avisoSuscripcion='La baja quedó registrada.';
    }catch(e){this.errorSuscripcion=(e as Error).message;}
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
  pestanaAdmin: 'tablero' | 'anuncios' | 'campanas' | 'suscriptores' = 'tablero';
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

  async guardarCampana():Promise<void> {
    const p=this.programacionActual;this.mensajeCampanas='';
    if(!this.programacionValida(p,this.frecuenciaSeleccionada)){this.mensajeCampanas='Revisa fecha, día y hora.';return;}
    try{await this.api('/admin/campanas/'+this.frecuenciaSeleccionada,{method:'PUT',body:JSON.stringify(p)});
      this.mensajeCampanas='Programación guardada en PostgreSQL. Sin envío automático todavía.';
      await this.cargarAdmin();
    }catch(e){this.mensajeCampanas=(e as Error).message;}
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


  // Esta etapa SOLO mide actividad de este navegador. No hay backend, usuarios
  // compartidos, facturación ni Google Search Console conectados.
  private readonly claveEventos = 'cerca_eventos_locales_v1';
  private readonly claveOpiniones = 'cerca_opiniones_locales_v1';
  private readonly claveDispositivo = 'cerca_dispositivo_local_v1';
  eventos: EventoCerca[] = [];
  opinionesCerca: OpinionCerca[] = [];
  periodoTablero: 'hoy' | 'semana' | 'mes' | 'anio' = 'mes';
  comunaTablero = 'Todas';
  categoriaTablero = 'Todas';
  dispositivoLocal = '';
  estrellasEditor = 0;
  motivosEditor: string[] = [];
  comentarioEditor = '';
  avisoOpinion = '';
  errorOpinion = '';
  readonly motivosPositivos = ['Buena atención', 'Atención rápida', 'Trato respetuoso', 'Recibí lo que pedí', 'Resolvieron mi problema', 'Superó mis expectativas'];
  readonly motivosNeutros = ['Atención aceptable', 'Podrían mejorar', 'Servicio incompleto'];
  readonly motivosNegativos = ['Mala atención', 'Atención lenta', 'Trato irrespetuoso', 'No recibí lo que pedí', 'No era lo que esperaba', 'No resolvieron mi problema'];

  private iniciarMetricas():void {
    if(typeof window==='undefined')return;
    try {
      this.dispositivoLocal=window.localStorage.getItem(this.claveDispositivo)||'';
      if(!this.dispositivoLocal){this.dispositivoLocal='cerca-'+(window.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now());
        window.localStorage.setItem(this.claveDispositivo,this.dispositivoLocal);}
      if(!this.mostrarAdministracion&&!window.sessionStorage.getItem('cerca_visita_sesion_v1')){
        window.sessionStorage.setItem('cerca_visita_sesion_v1','1');
        // registrar la visita después de establecer la conexión a API
        this.visitaPendiente=true;
      }
    }catch{}
  }
  private visitaPendiente=false;

  registrarEvento(tipo: TipoEventoCerca,n?: Negocio):void {
    if(typeof window==='undefined'||this.mostrarAdministracion)return;
    const evento:EventoCerca={fecha:new Date().toISOString(),tipo,
      comuna:n?.comuna??this.comuna,
      categoria:n?.categoria??(this.categoriaActiva!=='Todos'?this.categoriaActiva:undefined),
      negocioId:n?.id};
    if(!this.apiDisponible)return;
    void this.api('/eventos',{method:'POST',body:JSON.stringify(evento)}).catch(()=>{});
  }

  // Un voto por negocio Y navegador, editable. No equivale a compra verificada.
  get razonesDisponibles(): string[] {
    return this.estrellasEditor >= 4 ? this.motivosPositivos :
      this.estrellasEditor === 3 ? this.motivosNeutros : this.motivosNegativos;
  }
  elegirEstrellas(valor: number): void {
    this.estrellasEditor = valor;
    this.motivosEditor = [];
    this.errorOpinion = '';
    this.avisoOpinion = '';
  }
  alternarMotivo(motivo: string): void {
    this.motivosEditor = this.motivosEditor.includes(motivo) ?
      this.motivosEditor.filter(m => m !== motivo) : [...this.motivosEditor, motivo];
  }
  get opinionPropia(): OpinionCerca | undefined {
    if (!this.negocioSeleccionado) return undefined;
    return this.opinionesCerca.find(o => o.negocioId === this.negocioSeleccionado?.id && o.dispositivo === this.dispositivoLocal);
  }
  async enviarOpinion():Promise<void> {
    const n=this.negocioSeleccionado;
    this.errorOpinion='';this.avisoOpinion='';if(!n)return;
    if(this.estrellasEditor<1||this.estrellasEditor>5||!this.motivosEditor.length){this.errorOpinion='Selecciona estrellas y al menos un motivo.';return;}
    if(!this.dispositivoLocal){this.errorOpinion='El dispositivo no puede identificarse para evitar duplicados.';return;}
    try{
      await this.api('/opiniones',{method:'POST',body:JSON.stringify({negocioId:n.id,
        dispositivo:this.dispositivoLocal,estrellas:this.estrellasEditor,motivos:this.motivosEditor,comentario:this.comentarioEditor.trim()})});
      const [opiniones,reputacion]=await Promise.all([
        this.api<OpinionCerca[]>('/reputacion'),
        this.api<Record<number,{promedio:number;total:number}>>('/reputacion/resumen')]);
      this.opinionesCerca=opiniones;this.reputacionPorNegocio=reputacion;
      this.avisoOpinion='Evaluación registrada en CERCA (experiencia no verificada).';
    }catch(e){this.errorOpinion=(e as Error).message;}
  }
  calificacionCerca(n: Negocio): { promedio: number; total: number } | null {
    if(this.apiDisponible)return this.reputacionPorNegocio[n.id]||null;
    const opiniones = this.opinionesCerca.filter(o => o.negocioId === n.id);
    if (!opiniones.length) return null;
    return { promedio: opiniones.reduce((acc, o) => acc + o.estrellas, 0) / opiniones.length, total: opiniones.length };
  }
  obtenerNegocio(id: number): Negocio | undefined { return this.negocios.find(n => n.id === id); }
  async gestionarReclamo(opinion:OpinionCerca,estado:'pendiente'|'resuelto'):Promise<void> {
    try{await this.api('/admin/opiniones/'+opinion.id,{method:'PUT',body:JSON.stringify({estado,respuesta:opinion.respuesta||''})});
      opinion.estado=estado;this.avisoAdministracion='Estado actualizado en PostgreSQL.';
    }catch(e){this.avisoAdministracion=(e as Error).message;}
  }
  async guardarRespuesta(opinion:OpinionCerca):Promise<void> {
    await this.gestionarReclamo(opinion,opinion.estado);
  }

  private desdePeriodo(fecha: string): boolean {
    const valor = Date.parse(fecha);
    if (!Number.isFinite(valor)) return false;
    const ahora = new Date();
    const inicio = new Date(ahora);
    if (this.periodoTablero === 'hoy') inicio.setHours(0, 0, 0, 0);
    if (this.periodoTablero === 'semana') inicio.setDate(inicio.getDate() - 6), inicio.setHours(0,0,0,0);
    if (this.periodoTablero === 'mes') inicio.setDate(inicio.getDate() - 29), inicio.setHours(0,0,0,0);
    if (this.periodoTablero === 'anio') inicio.setMonth(inicio.getMonth() - 11), inicio.setDate(1), inicio.setHours(0,0,0,0);
    return valor >= inicio.getTime() && valor <= ahora.getTime();
  }
  get eventosTablero(): EventoCerca[] {
    return this.eventos.filter(e => this.desdePeriodo(e.fecha) &&
      (this.comunaTablero === 'Todas' || e.comuna === this.comunaTablero) &&
      (this.categoriaTablero === 'Todas' || e.categoria === this.categoriaTablero));
  }
  get negociosTablero(): Negocio[] {
    return this.negocios.filter(n =>
      (this.comunaTablero === 'Todas' || n.comuna === this.comunaTablero) &&
      (this.categoriaTablero === 'Todas' || n.categoria === this.categoriaTablero));
  }
  get opinionesTablero(): OpinionCerca[] {
    const ids = new Set(this.negociosTablero.map(n => n.id));
    return this.opinionesCerca.filter(o => ids.has(o.negocioId) && this.desdePeriodo(o.fecha));
  }
  totalEvento(tipo: TipoEventoCerca): number {
    if(this.resumenGlobal)return this.resumenGlobal.eventos[tipo]||0;
    return this.eventosTablero.filter(e => e.tipo === tipo).length;
  }
  get accionesContacto(): number {
    return this.totalEvento('whatsapp') + this.totalEvento('web') + this.totalEvento('ruta') + this.totalEvento('telefono');
  }
  get tasaInteraccion(): number | null {
    const fichas = this.totalEvento('ficha');
    return fichas ? Math.round(1000 * this.accionesContacto / fichas) / 10 : null;
  }
  get promedioReputacion(): number | null {
    if(this.resumenGlobal)return this.resumenGlobal.reputacion?.promedio==null?null:Number(this.resumenGlobal.reputacion.promedio);
    if (!this.opinionesTablero.length) return null;
    return this.opinionesTablero.reduce((t, o) => t + o.estrellas, 0) / this.opinionesTablero.length;
  }
  get reclamosTablero(): OpinionCerca[] {
    return this.opinionesTablero.filter(o => o.estrellas <= 2).sort((a,b) => b.fecha.localeCompare(a.fecha));
  }
  get reclamosPendientes(): number { return this.resumenGlobal?Number(this.resumenGlobal.reputacion?.pendientes||0):this.reclamosTablero.filter(o => o.estado !== 'resuelto').length; }
  get felicitacionesTablero(): number { return this.resumenGlobal?Number(this.resumenGlobal.reputacion?.felicitaciones||0):this.opinionesTablero.filter(o => o.estrellas >= 4).length; }
  get horarioPendiente(): number { return this.negociosTablero.filter(n => !n.horario).length; }
  get webPendiente(): number { return this.negociosTablero.filter(n => !this.webUrl(n)).length; }
  get whatsappPendiente(): number { return this.negociosTablero.filter(n => !this.whatsappUrl(n)).length; }
  get fichaSinRevision(): number { return this.negociosTablero.filter(n => !n.fechaRevision && !n.datosVerificados).length; }
  get campanasProgramadas(): number { return Object.values(this.configuracionCampanas).filter(c => c.activa).length; }
  private agruparEventos(tipo: TipoEventoCerca | null, campo: 'comuna' | 'categoria' | 'negocioId', limite = 6): FilaMetrica[] {
    const cuentas = new Map<string,number>();
    for (const e of this.eventosTablero) {
      if (tipo && e.tipo !== tipo) continue;
      const clave = e[campo];
      if (clave === undefined || clave === null || clave === '') continue;
      const texto = campo === 'negocioId' ? (this.obtenerNegocio(Number(clave))?.nombre || ('Negocio #' + clave)) : String(clave);
      cuentas.set(texto, (cuentas.get(texto) || 0) + 1);
    }
    const filas = [...cuentas.entries()].sort((a,b) => b[1] - a[1]).slice(0, limite);
    const maximo = filas[0]?.[1] || 1;
    return filas.map(([nombre,valor]) => ({nombre,valor,porcentaje:100*valor/maximo}));
  }
  get comunasMasBuscadas(): FilaMetrica[] { return this.agruparEventos('busqueda','comuna'); }
  get negociosMasVistos(): FilaMetrica[] { return this.agruparEventos('ficha','negocioId',5); }
  get rendimientoNegocios(): Array<{ negocio: Negocio; vistas: number; whatsapp: number; rutas: number; web: number; telefono: number; promedio: number | null; evaluaciones: number }> {
    const actividad = new Map<number, {vistas:number;whatsapp:number;rutas:number;web:number;telefono:number}>();
    for (const e of this.eventosTablero) {
      if (e.negocioId === undefined) continue;
      const dato = actividad.get(e.negocioId) || { vistas:0, whatsapp:0, rutas:0, web:0, telefono:0 };
      if (e.tipo === 'ficha') dato.vistas++;
      if (e.tipo === 'whatsapp') dato.whatsapp++;
      if (e.tipo === 'ruta') dato.rutas++;
      if (e.tipo === 'web') dato.web++;
      if (e.tipo === 'telefono') dato.telefono++;
      actividad.set(e.negocioId,dato);
    }
    return this.negociosTablero.map(negocio => {
      const a = actividad.get(negocio.id) || { vistas:0, whatsapp:0, rutas:0, web:0, telefono:0 };
      const ops=this.opinionesTablero.filter(o=>o.negocioId===negocio.id);
      return { negocio, ...a, promedio:ops.length?ops.reduce((s,o)=>s+o.estrellas,0)/ops.length:null, evaluaciones:ops.length };
    }).sort((a,b) => (b.vistas+b.whatsapp+b.web+b.rutas+b.telefono)-(a.vistas+a.whatsapp+a.web+a.rutas+a.telefono));
  }
  get categoriasMasConsultadas(): FilaMetrica[] { return this.agruparEventos('categoria','categoria'); }
  get motivosFrecuentes(): FilaMetrica[] {
    const datos = new Map<string, number>();
    for (const o of this.opinionesTablero) for (const m of o.motivos) datos.set(m, (datos.get(m) || 0) + 1);
    const filas = [...datos.entries()].sort((a,b) => b[1]-a[1]).slice(0,6);
    const maximo = filas[0]?.[1] || 1;
    return filas.map(([nombre,valor]) => ({nombre,valor,porcentaje:100*valor/maximo}));
  }
  get serieVisitas(): BarraMetrica[] {
    const ahora = new Date();
    const total = this.periodoTablero === 'hoy' ? 12 : this.periodoTablero === 'semana' ? 7 :
      this.periodoTablero === 'mes' ? 15 : 12;
    const grupos: { clave:string; etiqueta:string; valor:number }[]=[];
    const fechaLocal = (d:Date) => d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    for (let i=total-1;i>=0;i--) {
      const d = new Date(ahora);
      if (this.periodoTablero==='hoy') d.setHours((total-1-i)*2,0,0,0);
      else if(this.periodoTablero==='anio') d.setMonth(d.getMonth()-i,1),d.setHours(0,0,0,0);
      else d.setDate(d.getDate()-i*(this.periodoTablero==='mes'?2:1)),d.setHours(0,0,0,0);
      const clave=this.periodoTablero==='hoy'? 'h'+d.getHours():
        this.periodoTablero==='anio'? 'm'+d.getFullYear()+'-'+d.getMonth():fechaLocal(d);
      const etiqueta=this.periodoTablero==='hoy'? d.getHours()+'h':
        this.periodoTablero==='anio'?d.toLocaleDateString('es-CL',{month:'short'}):
        d.toLocaleDateString('es-CL',{day:'numeric',month:'short'});
      grupos.push({clave,etiqueta,valor:0});
    }
    for(const evento of this.eventosTablero){
      if(evento.tipo!=='visita')continue;
      const d=new Date(evento.fecha);
      let clave='';
      if(this.periodoTablero==='hoy')clave='h'+Math.floor(d.getHours()/2)*2;
      else if(this.periodoTablero==='anio')clave='m'+d.getFullYear()+'-'+d.getMonth();
      else if(this.periodoTablero==='mes'){
        const dia = new Date(ahora.getFullYear(),ahora.getMonth(),ahora.getDate()).getTime();
        const anterior = new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
        const diferencia = Math.round((dia-anterior)/86400000);
        const base = new Date(ahora);base.setDate(base.getDate()-Math.floor(diferencia/2)*2);
        clave=fechaLocal(base);
      } else clave=fechaLocal(d);
      const grupo=grupos.find(g=>g.clave===clave);if(grupo)grupo.valor++;
    }
    const maximo=Math.max(1,...grupos.map(g=>g.valor));
    return grupos.map(g=>({etiqueta:g.etiqueta,valor:g.valor,alto:g.valor?Math.max(5,100*g.valor/maximo):3}));
  }
  exportarMetricas(): void {
    if (typeof document === 'undefined') return;
    const datos = {descripcion:'Datos locales de prueba de este navegador, NO métricas globales',
      exportado: new Date().toISOString(), eventos:this.eventos,
      opiniones:this.opinionesCerca.map(({dispositivo, ...resto})=>resto),
      negocios:this.negocios.length};
    const url=URL.createObjectURL(new Blob([JSON.stringify(datos,null,2)],{type:'application/json'}));
    const a=document.createElement('a'); a.href=url; a.download='cerca-metricas-locales.json'; a.click(); URL.revokeObjectURL(url);
  }
  irSeccionTablero(id:string):void {
    if(typeof document==='undefined')return;
    document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
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
        this.accesoConcedido = true;this.decisionSuscripcion='si';
      } else if (decisionGuardada?.version === 1 && decisionGuardada?.estado === 'no') {
        this.accesoRechazado = true;this.decisionSuscripcion='no';
      }
    } catch {
      // Mostrar la burbuja si el navegador no permite leer el almacenamiento.
    }
    // La fuente de verdad es PostgreSQL. Los anuncios locales antiguos solo se importan
    // por elección explícita del administrador desde "Importar mis anuncios antiguos".
    // No se sobrescribe la base central desde localStorage al abrir la página.
    this.iniciarMetricas();
    void this.iniciarServidor();
  }

  @HostListener('window:hashchange')
  sincronizarPantalla(): void {
    if (typeof window !== 'undefined') {
      this.mostrarAdministracion = window.location.hash === '#admin';
      if (!this.mostrarAdministracion) {
        this.formularioAbierto = false;
        if (!window.sessionStorage.getItem('cerca_visita_sesion_v1')) {
          try { window.sessionStorage.setItem('cerca_visita_sesion_v1', '1'); } catch { /* sesión no disponible */ }
          this.registrarEvento('visita');
        }
      }
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

  async alternarDestacado(negocio:Negocio):Promise<void> {
    try{const nuevo=await this.guardarRemoto({...negocio,destacado:negocio.destacado!==true,prioridadDestacado:negocio.prioridadDestacado??100});
      this.negocios=this.negocios.map(n=>n.id===negocio.id?nuevo:n);
    }catch(e){this.avisoAdministracion=(e as Error).message;}
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

  private async guardarRemoto(n:Negocio):Promise<Negocio> {
    const nuevo=n.id===0;
    return this.api<Negocio>(nuevo?'/admin/negocios':'/admin/negocios/'+n.id,
      {method:nuevo?'POST':'PUT',body:JSON.stringify(n)});
  }

  async guardarAnuncio():Promise<void> {
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
    try{
      const guardado=await this.guardarRemoto(n);
      this.negocios=n.id===0?[guardado,...this.negocios]:this.negocios.map(x=>x.id===n.id?guardado:x);
      this.avisoAdministracion='Negocio guardado para todos los visitantes en PostgreSQL.';
      this.formularioAbierto=false;
    }catch(e){this.errorFormulario=(e as Error).message;}

  }

  async cambiarPublicacion(negocio:Negocio):Promise<void> {
    try{const nuevo=await this.guardarRemoto({...negocio,publicado:negocio.publicado===false});
      this.negocios=this.negocios.map(n=>n.id===negocio.id?nuevo:n);
      this.avisoAdministracion='Publicación actualizada en el servidor.';
    }catch(e){this.avisoAdministracion=(e as Error).message;}
  }
  async eliminarAnuncio(negocio:Negocio):Promise<void> {
    if(typeof window==='undefined'||!window.confirm('¿Eliminar "'+negocio.nombre+'" del servidor para todos los visitantes?'))return;
    try{await this.api('/admin/negocios/'+negocio.id,{method:'DELETE'});
      this.negocios=this.negocios.filter(n=>n.id!==negocio.id);this.avisoAdministracion='Negocio eliminado del servidor.';
    }catch(e){this.avisoAdministracion=(e as Error).message;}
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
        const eraGpsActivo = this.gpsHabilitado;
        this.gpsHabilitado = true;
        this.estadoGPS = 'Ubicación activa · distancias actualizadas al desplazarte.';
        // No se guarda la ubicación exacta: solo el acto de activarla.
        if (!eraGpsActivo) this.registrarEvento('gps');
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
    const mensaje = [
      `¡Hola, ${n.nombre}! 👋`,
      'Encontré tu ficha en CERCA.cl, la app que conecta vecinos con negocios y profesionales de su barrio.',
      'Me gustaría consultar por tus servicios.',
      '🟠 Este contacto llegó desde CERCA.cl.'
    ].join('\n\n');
    // WhatsApp abre el borrador: el usuario decide si enviarlo.
    return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
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
    if (n.recomendacionEditorial && typeof n.calificacion === 'number') {
      return `${n.calificacion.toFixed(1)}/5 · recomendación editorial`;
    }
    return typeof n.calificacion === 'number' && n.calificacion >= 0 && n.calificacion <= 5
      ? `${n.calificacion.toLocaleString('es-CL', { maximumFractionDigits: 1 })}/5${n.datosVerificados === true ? '' : ' · muestra'}`
      : 'Sin calificación';
  }

  get negociosFiltrados(): Negocio[] {
    const texto = this.busqueda.trim().toLocaleLowerCase('es');
    return this.negocios.filter((negocio) => {
      if (negocio.publicado === false) return false;
      const coincideCategoria = this.categoriasIntencion ? this.categoriasIntencion.includes(negocio.categoria) : (this.categoriaActiva === 'Todos' || negocio.categoria === this.categoriaActiva);
      const coincideOficio = !this.oficioSeleccionado || this.negocioDeOficio(negocio, this.oficioSeleccionado);
      const coincideComuna = negocio.comuna === this.comuna;
      const km = this.distanciaReal(negocio);
      const coincideDistancia = this.distanciaMaxima === 999 || km === null || km <= this.distanciaMaxima;
      const coincideTexto = [negocio.nombre, negocio.categoria, negocio.descripcion, negocio.comuna, negocio.direccion || '']
        .join(' ').toLocaleLowerCase('es').includes(texto);
      const coincideFavorito = !this.mostrarSoloFavoritos || this.favoritos.has(negocio.id);
      return coincideCategoria && coincideOficio && coincideComuna && coincideDistancia && coincideTexto && coincideFavorito;
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

  cambiarModoEntrada(modo: 'necesito' | 'descubrir'): void {
    this.modoEntrada = modo;
    this.entradaTexto = '';
    this.errorEntrada = '';
  }

  usarSugerencia(texto: string): void {
    this.entradaTexto = texto;
    this.buscarPorIntencion();
  }

  private normalizarIntencion(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL');
  }

  // Clasificación sencilla y explícita: no usa IA ni inventa stock o disponibilidad.
  // Estas etiquetas deberán convertirse después en servicios/productos de PostgreSQL.
  private rubrosParaIntencion(texto: string): Categoria[] {
    const t = this.normalizarIntencion(texto);
    const reglas: { patron: RegExp; categorias: Categoria[] }[] = [
      { patron: /\b(pan|marraqueta|hallulla|amasanderia|panaderia|panaderias)\b/, categorias: ['Panaderías'] },
      { patron: /\b(rueda|neumatico|neumaticos|pinchazo|vulcanizaci[oó]n|vulca|llanta)\b/, categorias: ['Vulcanización', 'Mecánicos'] },
      { patron: /\b(mecanico|mecanica|auto|vehiculo|aceite|mantencion|bateria)\b/, categorias: ['Mecánicos', 'Vulcanización'] },
      { patron: /\b(papel lustre|papeleria|libreria|cuaderno|utiles|lapices|bazar)\b/, categorias: ['Tiendas'] },
      { patron: /\b(cafe|cafeteria|desayuno|once|capuchino)\b/, categorias: ['Cafés'] },
      { patron: /\b(torta|pastel|dulce|pasteleria|reposteria)\b/, categorias: ['Panaderías', 'Cafés'] },
      { patron: /\b(hambre|comer|almuerzo|almorzar|cena|cenar|hamburguesa|pizza|sushi)\b/, categorias: ['Cafés', 'Bares', 'Panaderías'] },
      { patron: /\b(salir|carrete|panorama|musica|tragos|bar|pub)\b/, categorias: ['Bares', 'Cafés'] },
      { patron: /\b(relajarme|descansar|pasear)\b/, categorias: ['Cafés', 'Viveros'] },
      { patron: /\b(perro|gato|mascota|mascotas|veterinaria|alimento)\b/, categorias: ['Mascotas'] },
      { patron: /\b(peluqueria|barberia|corte de pelo|manicure|belleza)\b/, categorias: ['Peluquería'] },
      { patron: /\b(planta|plantas|jardin|jardineria|flores|vivero)\b/, categorias: ['Viveros'] },
      { patron: /\b(remedio|remedios|medicamento|farmacia)\b/, categorias: ['Farmacias'] },
      { patron: /\b(computador|notebook|computacion|pc|impresora)\b/, categorias: ['Computación'] },
      { patron: /\b(gasfiter|gasfiteria|electricista|cerrajero|maestro|reparacion|delivery|repartidor|despacho)\b/, categorias: ['Servicios'] }
    ];
    const encontrados = new Set<Categoria>();
    for (const regla of reglas) {
      if (regla.patron.test(t)) regla.categorias.forEach(c => encontrados.add(c));
    }
    return [...encontrados];
  }

  buscarPorIntencion(): void {
    const texto = this.entradaTexto.trim().replace(/\s+/g, ' ').slice(0, 180);
    if (!texto) {
      this.errorEntrada = 'Escribe lo que necesitas o selecciona una sugerencia.';
      return;
    }
    this.errorEntrada = '';
    this.consultaActiva = texto;
    this.categoriaActiva = 'Todos';
    this.mostrarSoloFavoritos = false;
    const rubros = this.rubrosParaIntencion(texto);
    this.categoriasIntencion = rubros.length ? rubros : null;
    // Si entendimos la categoría, no buscamos literalmente «necesito pan».
    // Si no la entendimos, buscamos las palabras clave en los nombres/descripciones.
    this.busqueda = rubros.length ? '' : this.normalizarIntencion(texto)
      .replace(/\b(necesito|quiero|busco|comprar|encontrar|un|una|unos|unas|el|la|los|las|de|para|por|favor|hoy)\b/g, ' ')
      .replace(/\s+/g, ' ').trim();
    this.registrarEvento('busqueda');
    this.irA('explorar');
  }

  buscar(): void {
    this.oficioSeleccionado = null;
    this.categoriasIntencion = null;
    this.consultaActiva = '';
    this.registrarEvento('busqueda');
    this.irA('explorar');
  }

  seleccionarCategoria(categoria: Categoria): void {
    this.cerrarPanelOficios();
    this.categoriasIntencion = null;
    this.consultaActiva = '';
    this.busqueda = '';
    this.categoriaActiva = categoria;
    this.registrarEvento('categoria');
    this.mostrarSoloFavoritos = false;
    this.irA('explorar');
  }

  alternarFavorito(id: number): void {
    this.registrarEvento('favorito', this.obtenerNegocio(id));
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
    this.registrarEvento('ficha', negocio);
    this.negocioSeleccionado = negocio;
    const anterior = this.opinionesCerca.find(o => o.negocioId === negocio.id && o.dispositivo === this.dispositivoLocal);
    this.estrellasEditor = anterior?.estrellas || 0;
    this.motivosEditor = [...(anterior?.motivos || [])];
    this.comentarioEditor = anterior?.comentario || '';
    this.errorOpinion = '';
    this.avisoOpinion = '';
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
    this.cerrarPanelOficios();
    this.categoriasIntencion = null;
    this.consultaActiva = '';
    this.entradaTexto = '';
    this.errorEntrada = '';
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
