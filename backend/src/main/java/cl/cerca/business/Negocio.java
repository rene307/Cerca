package cl.cerca.business;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="negocios") public class Negocio {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @Column(nullable=false) public String nombre;
 @Column(nullable=false) public String categoria;
 @Column(nullable=false) public String comuna;
 @Column(nullable=false) public String direccion;
 @Column(nullable=false,length=500) public String descripcion;
 @Column(name="latitud",nullable=false) public BigDecimal latitud;
 @Column(name="longitud",nullable=false) public BigDecimal longitud;
 @Column(name="imagen_url",nullable=false,length=800) public String imagenUrl;
 public String telefono;
 @Column(nullable=false) public boolean publicado;
 protected Negocio(){}
}
