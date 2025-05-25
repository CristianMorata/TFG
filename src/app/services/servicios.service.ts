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

  constructor() {}

  public listarProductosVenta$(): Observable<any[]> {
    return this.http.get<any[]>(
      'https://listarproductosventa-rs2gjhs4iq-uc.a.run.app'
    );
  }

  public añadirProductoVenta$(
    nombre: string,
    descripcion: string,
    precio: number,
    alergenos: [],
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
}

// public listarProductosVenta$(): Observable<Book[]>{
//     return this.http.get<{libros: BookDTO[]}>('https://listarproductosventa-rs2gjhs4iq-uc.a.run.app').pipe(
//       map(reponse => reponse.libros.map(book => new Book(book.clave, book.titulo))),
//     );
//   }

// .map(productoVenta => new ProductoVenta(productoVenta.id, productoVenta.nombre, productoVenta.precio, productoVenta.descripcion))
// public getDishesFromBooks$(bookId: string): Observable<Dish[]>{
//   return this.http.get<{platos: DishDTO[]}>(`http://localhost:8080/controlador.php?operacion=obtener_platos&libro=${bookId}`).pipe(
//     map(response => response.platos.map(dish => new Dish(dish.clave, dish.nombre, dish.foto))),
//   )
// }

// public obtenerProductos$(): Observable<Productos[]>{
//   return this.http.get("").pipe(
//     map(dishesUnflatten => dishesUnflatten.flat()),
//   )
// }
