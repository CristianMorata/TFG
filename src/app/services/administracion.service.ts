import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

// export interface ProductoVenta {
//   id: string;
//   nombre: string;
//   precio: number;
//   descripcion: string;
//   // Añade más campos según lo que devuelva tu endpoint
// }

@Injectable({
  providedIn: 'root'
})
export class AdministracionService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'https://listarproductosventa-rs2gjhs4iq-uc.a.run.app';

  constructor() {}

  public listarProductosVenta$(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
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
