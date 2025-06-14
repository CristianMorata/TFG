import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// export interface ProductoVenta {
//   id: string;
//   nombre: string;
//   precio: number;
//   descripcion: string;
//   // Añade más campos según lo que devuelva tu endpoint
// }

@Injectable({
  providedIn: 'root',
})
export class ServiciosService {
  private http = inject(HttpClient);

  constructor() { }

  public listarProductosVenta$(): Observable<any[]> {
    return this.http.get<any[]>(
      'https://listarproductosventa-rs2gjhs4iq-uc.a.run.app'
    );
  }

  public añadirProductoVenta$(
    nombre: string,
    descripcion: string,
    precio: number,
    alergenos: string[],
    visible: boolean,
    novedad: boolean,
    tipo_comida: string,
    categoria: string
  ): Observable<any> {
    return this.http.post<any>(
      'https://agregarproductoventa-rs2gjhs4iq-uc.a.run.app',
      {
        nombre,
        descripcion,
        precio,
        alergenos,
        visible,
        novedad,
        tipo_comida,
        categoria,
      }
    );
  }

  // URL del servicio para modificar un producto
  private modificarProductoUrl = 'https://modificarproductoventa-rs2gjhs4iq-uc.a.run.app';
  modificarProducto(producto: any) {
    return this.http.post(this.modificarProductoUrl, producto);
  }

  // URL del servicio para eliminar un producto
  eliminarProducto(producto: { id: string, categoria: string }) {
    const url = 'https://eliminarproductoventa-rs2gjhs4iq-uc.a.run.app';
    return this.http.post(url, {
      id: producto.id,
      categoria: producto.categoria
    });
  }


  // Funciones del objeto MESA
  guardarOModificarMesa(data: {
    mesaId: string,
    contenido: any[],
    estado: string,
    anotaciones?: string
  }) {
    return this.http.post('https://guardaromodificarmesa-rs2gjhs4iq-uc.a.run.app', data);
  }

  cerrarMesa(mesaId: string) {
    const url = 'https://cerrarmesa-rs2gjhs4iq-uc.a.run.app';
    return this.http.post(url, { mesaId });
  }

  // Funciones del objeto MESA
  listarTodos(): Observable<any> {
    return this.http.get<any>(`https://listartodaslasmesas-rs2gjhs4iq-uc.a.run.app`);
  }

  // Marcar producto como servido
  marcarServido(productoId: number): Observable<any> {
    return this.http.patch(
      `https://listartodaslasmesas-rs2gjhs4iq-uc.a.run.app/productos/${productoId}`,
      { estado: 'Servido' }
    );
  }

  obetenerCategorias(): Observable<any> {
    return this.http.get<any>(`https://obtenercategorias-rs2gjhs4iq-uc.a.run.app/`);
  }
}
