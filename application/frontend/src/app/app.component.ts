import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CognitoService } from './cognito.service';
import { TodoItem } from './todoitem.model';
import { TodoItemsService } from './todoitems.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'todo-application';
  items: TodoItem[] = [];

  whatToDo = new FormControl('');

  constructor(private cognitoService: CognitoService, private route: ActivatedRoute, private todoItemsService: TodoItemsService) { }

  ngOnInit() {
    if (!this.cognitoService.isLoggedIn()) {
      this.route.queryParamMap.subscribe((paramsMap: any) => {
        if (paramsMap?.params?.code) {
          this.cognitoService.retrieveIdToken(paramsMap.params.code).subscribe(_ => {
            this.getItems()
          })
        }
      })
    } else {
      this.getItems()
    }
  }

  getItems() {
    this.todoItemsService.getItems().subscribe(items => {
      this.items = items
    })
  }

  login() {
    this.cognitoService.login();
  }

  logout() {
    this.cognitoService.logout();
  }

  isLoggedIn() {
    return this.cognitoService.isLoggedIn();
  }

  addItem() {
    let newItem = new TodoItem()
    newItem.what = this.whatToDo.value
    this.whatToDo.setValue('')
    this.todoItemsService.addItem(newItem).subscribe(result => {
      this.getItems()
    })
  }
}
