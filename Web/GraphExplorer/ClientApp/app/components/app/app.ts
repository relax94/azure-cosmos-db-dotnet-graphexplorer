import { Aurelia } from 'aurelia-framework';
import { Router, RouterConfiguration } from 'aurelia-router';

export class App {
    router: Router;

    configureRouter(config: RouterConfiguration, router: Router) {
        config.title = 'Microsoft';
        config.map([{
			route: [ '', 'network' ],
			name: 'network',
			moduleId: '../network/network',
			nav: true,
			title: 'Azure Graph Explorer'
		}]);

        this.router = router;
    }
}
