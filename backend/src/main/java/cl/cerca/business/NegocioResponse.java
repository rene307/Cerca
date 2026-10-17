package cl.cerca.business;
import java.math.BigDecimal;
public record NegocioResponse(Long id,String nombre,String categoria,String comuna,String direccion,String descripcion,BigDecimal latitud,BigDecimal longitud,String imagenUrl,String telefono,Double distanciaKm) {}
