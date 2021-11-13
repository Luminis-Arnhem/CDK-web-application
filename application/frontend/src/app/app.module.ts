import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CognitoService } from './cognito.service';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TodoItemsService } from './todoitems.service';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([]),
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    CognitoService,
    TodoItemsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
