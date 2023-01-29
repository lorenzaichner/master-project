import * as queryString from 'query-string';
import * as environment from '../../config/environment.json';

const BASE_URL = environment.Api.BaseUrl;

export class ApiService {
  public static async post<T>(route: string, body?: BodyInit, query?: queryString.StringifiableRecord, headers?: Record<string, string>): Promise<T> {
    let url = `${BASE_URL}${route}`;
    if(query != null) {
      url += `?${queryString.stringify(query)}`;
    }

    return new Promise((resolve, reject) => {
      fetch(url, {
        method: 'POST',
        body: body,
        headers: headers
      })
        .then(response => response.json())
        .then(data => {
          if(data.success != true) {
            throw new Error(data.errorMessage);
          }
          resolve(data);
        })
        .catch(err => reject(err));
    });
  }

  public static async get<T>(route: string, headers?: Record<string, string>): Promise<T> {
    const url = `${BASE_URL}${route}`;
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: 'GET',
        headers: headers,
      })
        .then(response => response.json())
        .then(data => {
          if(data.success != true) {
            throw new Error(`Request to '${route}' failed with ${JSON.stringify(data, null, 2)}`);
          }
          resolve(data);
        })
        .catch(err => reject(err));
    });
  }

  public static async delete<T>(route: string, headers?: Record<string, string>): Promise<T> {
    const url = `${BASE_URL}${route}`;
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: 'DELETE',
        headers: headers,
      })
        .then(response => response.json())
        .then(data => {
          if(data.success != true) {
            throw new Error(`Request to '${route}' failed with ${JSON.stringify(data, null, 2)}`);
          }
          resolve(data);
        })
        .catch(err => reject(err));
    });
  }
}
