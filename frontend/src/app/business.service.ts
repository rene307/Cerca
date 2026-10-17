import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Negocio {id:number;nombre:string;categoria:string;comuna:string;direccion:string;descripcion:string;latitud:number;longitud:number;imagenUrl:string;telefono:string;distanciaKm:number|null}
@Injectable({providedIn:'root'}) export class BusinessService {
 private http=inject(HttpClient);
 private api='http://localhost:8080/api/negocios';
 listar(busqueda:string,categoria:string,lat?:number,lon?:number):Observable<Negocio[]> {
  let params=new HttpParams();
  if(busqueda.trim()) params=params.set('q',busqueda.trim());
  if(categoria!=='Todos')params=params.set('categoria',categoria);
  if(lat!==undefined&&lon!==undefined)params=params.set('lat',lat).set('lon',lon).set('radioKm',10);
  return this.http.get<Negocio[]>(this.api,{params});
 }
}
