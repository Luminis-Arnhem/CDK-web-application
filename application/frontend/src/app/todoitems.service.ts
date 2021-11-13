import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CognitoService } from './cognito.service';
import { ConfigService } from './config.service';
import { TodoItem } from './todoitem.model';
import { map } from 'rxjs/operators';

@Injectable()
export class TodoItemsService {

  constructor(private http: HttpClient, private cognitoService: CognitoService) {}

  getItems(): Observable<TodoItem[]> {
    return this.http.get<TodoItem[]>(ConfigService.get().itemsApi + 'item', {
        headers: {
            'Authorization': `${this.cognitoService.getIdToken()}`
        }
    }).pipe(
      map((response: any) => {
        return response.Items
      })
    )
  }

  addItem(item: TodoItem): Observable<any> {
    return this.http.put(ConfigService.get().itemsApi + 'item', item, {
      headers: {
        'Authorization': `${this.cognitoService.getIdToken()}`
      }
    })
  }
}
