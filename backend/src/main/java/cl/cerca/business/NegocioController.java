package cl.cerca.business;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
@RestController @RequestMapping("/api/negocios") public class NegocioController {
 private final NegocioRepository repo;
 public NegocioController(NegocioRepository repo){this.repo=repo;}
 @GetMapping public List<NegocioResponse> listar(@RequestParam(defaultValue="") String q,@RequestParam(required=false) String categoria,@RequestParam(required=false) Double lat,@RequestParam(required=false) Double lon,@RequestParam(defaultValue="10") double radioKm){
  if((lat==null)!=(lon==null))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Debes enviar lat y lon juntos");
  if(lat!=null&&(lat < -90||lat>90||lon< -180||lon>180||radioKm<=0||radioKm>50))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Coordenadas o radio inválidos");
  String term=q.toLowerCase(Locale.ROOT).trim();
  return repo.findAll().stream().filter(n->n.publicado)
   .filter(n->categoria==null||categoria.isBlank()||n.categoria.equalsIgnoreCase(categoria))
   .filter(n->(n.nombre+" "+n.descripcion+" "+n.comuna+" "+n.categoria).toLowerCase(Locale.ROOT).contains(term))
   .map(n->{Double distancia=lat==null?null:distance(lat,lon,n.latitud.doubleValue(),n.longitud.doubleValue());return new NegocioResponse(n.id,n.nombre,n.categoria,n.comuna,n.direccion,n.descripcion,n.latitud,n.longitud,n.imagenUrl,n.telefono,distancia);})
   .filter(n->lat==null||n.distanciaKm()<=radioKm)
   .sorted(Comparator.comparing(NegocioResponse::distanciaKm,Comparator.nullsLast(Double::compareTo)).thenComparing(NegocioResponse::id)).toList();
 }
 @GetMapping("/{id}") public NegocioResponse detalle(@PathVariable long id){Negocio n=repo.findById(id).filter(x->x.publicado).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Negocio no encontrado"));return new NegocioResponse(n.id,n.nombre,n.categoria,n.comuna,n.direccion,n.descripcion,n.latitud,n.longitud,n.imagenUrl,n.telefono,null);}
 private double distance(double lat1,double lon1,double lat2,double lon2){double p=Math.PI/180;double a=0.5-Math.cos((lat2-lat1)*p)/2+Math.cos(lat1*p)*Math.cos(lat2*p)*(1-Math.cos((lon2-lon1)*p))/2;return 12742*Math.asin(Math.min(1,Math.sqrt(Math.max(0,a))));}
}
