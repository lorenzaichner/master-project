import { PLATFORM } from "aurelia-framework";
import { RouterConfiguration, Router } from 'aurelia-router';
import 'bootstrap/dist/css/bootstrap.css';

export class App {
  private router: Router;

  configureRouter(config: RouterConfiguration, router: Router) {
    this.router = router;
    config.title = 'CDI Aurelia Frontend';
    config.map([
      { route: ['', 'home'], name: 'home', nav: true, title: 'Home', moduleId: PLATFORM.moduleName('components/home-page/home-page'), href: 'home' },
      { route: 'upload-page',   name: 'upload-page',  nav: true, title: 'Upload', moduleId: PLATFORM.moduleName('components/upload-page/upload-page'), href: 'upload-page' },
      { route: 'causal-discovery', name: 'causal-discovery', nav: true, title: 'Causal Discovery', moduleId: PLATFORM.moduleName('components/causal-discovery/causal-discovery'), href: 'causal-discovery' },
      { route: 'graph',   name: 'graph',  nav: true, title: 'Graph', moduleId: PLATFORM.moduleName('components/graph/graph'), href: 'graph' },
      { route: 'results-page', name: 'results-page', nav: true, title: 'Results', moduleId: PLATFORM.moduleName('components/results-page/results-page'), href: 'results-page' }
    ]);
  }
}
