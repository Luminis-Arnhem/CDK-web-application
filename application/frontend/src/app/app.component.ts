import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  username = new FormControl('');
  whatToDo = new FormControl('');

  constructor(private todoItemsService: TodoItemsService) { }

  ngOnInit() {
    this.username.valueChanges.subscribe(username => {
      this.getItems(username)
    })
  }

  getItems(username: String) {
    this.todoItemsService.getItems(username).subscribe(items => {
      this.items = items
    })
  }

  addItem() {
    let newItem = new TodoItem()
    newItem.what = this.whatToDo.value
    this.whatToDo.setValue('')
    this.todoItemsService.addItem(this.username.value, newItem).subscribe(result => {
      this.getItems(this.username.value)
    })
  }
}
