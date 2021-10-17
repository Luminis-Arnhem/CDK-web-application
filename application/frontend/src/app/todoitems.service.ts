import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { TodoItem } from './todoitem.model';
import { map } from 'rxjs/operators';

@Injectable()
export class TodoItemsService {

  constructor(private http: HttpClient) {}

  getItems(username: String): Observable<TodoItem[]> {
    return this.http.get<TodoItem[]>(ConfigService.get().itemsApi + 'item?user=' + username, {
        headers: {}
    }).pipe(
      map((response: any) => {
        return response.Items
      })
    )
  }

  addItem(username: String, item: TodoItem): Observable<any> {
    return this.http.put(ConfigService.get().itemsApi + 'item?user=' + username, item, {
      headers: {}
    })
  }
}
