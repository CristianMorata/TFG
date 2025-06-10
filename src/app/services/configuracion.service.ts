import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface ConfiguracionFlags {
  parametro1: boolean;
  parametro2: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  constructor(private http: HttpClient) { }

  getConfiguracion(): Observable<{ anadirProductosCamarero: boolean; anadirProductosClientes: boolean }> {
    return this.http.get<{ anadirProductosCamarero: boolean; anadirProductosClientes: boolean }>(
      `https://obtenerconfiguracion-rs2gjhs4iq-uc.a.run.app`
    );
  }

  updateConfiguracion(camarero: boolean, cliente: boolean): Observable<any> {
    return this.http.post(
      `https://actualizarconfiguracion-rs2gjhs4iq-uc.a.run.app`,
      {
        anadirProductosCamarero: camarero,
        anadirProductosClientes: cliente
      }
    );
  }
}
