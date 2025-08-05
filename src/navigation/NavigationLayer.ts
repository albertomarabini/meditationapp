import {
  createNavigationContainerRef,
  DrawerActions,
  StackActions,
  CommonActions,
  NavigationAction,
} from '@react-navigation/native';
import type { RootStackParamList } from './RootStackParamList'; // <-- your own stack param list!

// export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigationRef = createNavigationContainerRef();

export const NavigationService = {
  navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName]
  ) {
    if (navigationRef.isReady()) {
      // Types are correct now, no need for "as never"!
      (navigationRef.navigate as any)(name, params);
    }
  },

  goBack() {
    if (navigationRef.isReady()) {
      navigationRef.goBack();
    }
  },

  openDrawer() {
    console.log('openDrawer called')
    if (navigationRef.isReady()) {
      navigationRef.dispatch(DrawerActions.openDrawer());
    }
  },

  closeDrawer() {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(DrawerActions.closeDrawer());
    }
  },

  reset(
    routes: { name: keyof RootStackParamList; params?: any }[],
    index?: number
  ) {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: index ?? routes.length - 1,
        routes: routes.map((r) => ({ name: r.name, params: r.params })),
      });
    }
  },

  popToTop() {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.popToTop());
    }
  },

  dispatch(action: NavigationAction) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(action);
    }
  },
};
