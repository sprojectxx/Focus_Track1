import { registerRootComponent } from 'expo';
import App from './App';
import { registerMonthlyWidgetTask } from './widget/widget-task-handler';

// Register Android Home-Screen Launcher Widget task handler
registerMonthlyWidgetTask();

registerRootComponent(App);
