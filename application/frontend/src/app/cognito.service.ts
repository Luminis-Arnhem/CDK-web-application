import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CognitoService {

  private idToken: string;

  constructor(private http: HttpClient) {
    this.idToken = localStorage.getItem('id-token');
  }

  login() {
    window.location.href = `https://${ConfigService.get().cognitoDomain}.auth.${ConfigService.get().region}.amazoncognito.com/login?client_id=${ConfigService.get().cognitoClientId}&response_type=code&scope=openid&redirect_uri=${ConfigService.get().serverUrl}`;
  }

  retrieveIdToken(code: string): Observable<any> {
    let body = new HttpParams();
    body = body.set('grant_type', 'authorization_code');
    body = body.set('code', code);
    body = body.set('client_id', ConfigService.get().cognitoClientId);
    body = body.set('redirect_uri', ConfigService.get().serverUrl);
    return this.http.post(`https://${ConfigService.get().cognitoDomain}.auth.${ConfigService.get().region}.amazoncognito.com/oauth2/token`, body).pipe(
      tap(
        data => {
          this.idToken = data.id_token;
          localStorage.setItem('id-token', this.idToken);
        }
      )
    )
  }

  logout() {
    localStorage.removeItem('id-token');
    window.location.href = `https://${ConfigService.get().cognitoDomain}.auth.${ConfigService.get().region}.amazoncognito.com/logout?logout_uri=${ConfigService.get().serverUrl}&client_id=${ConfigService.get().cognitoClientId}`;
  }

  getIdToken(): String {
    return this.idToken;
  }

  isLoggedIn() {
    return this.idToken != null
  }
}
