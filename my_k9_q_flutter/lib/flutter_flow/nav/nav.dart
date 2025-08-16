import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '/backend/supabase/supabase.dart';

import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';

import '/index.dart';

export 'package:go_router/go_router.dart';
export 'serialization_util.dart';

const kTransitionInfoKey = '__transition_info__';

GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

class AppStateNotifier extends ChangeNotifier {
  AppStateNotifier._();

  static AppStateNotifier? _instance;
  static AppStateNotifier get instance => _instance ??= AppStateNotifier._();

  bool showSplashImage = true;

  void stopShowingSplashImage() {
    showSplashImage = false;
    notifyListeners();
  }
}

GoRouter createRouter(AppStateNotifier appStateNotifier) => GoRouter(
      initialLocation: '/',
      debugLogDiagnostics: true,
      refreshListenable: appStateNotifier,
      navigatorKey: appNavigatorKey,
      errorBuilder: (context, state) => appStateNotifier.showSplashImage
          ? Builder(
              builder: (context) => Container(
                color: FlutterFlowTheme.of(context).colorWhite,
                child: Center(
                  child: Image.asset(
                    'assets/images/myk9q_logo_no_text_crop.png',
                    width: 300.0,
                    height: 300.0,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            )
          : PLoginWidget(),
      routes: [
        FFRoute(
          name: '_initialize',
          path: '/',
          builder: (context, _) => appStateNotifier.showSplashImage
              ? Builder(
                  builder: (context) => Container(
                    color: FlutterFlowTheme.of(context).colorWhite,
                    child: Center(
                      child: Image.asset(
                        'assets/images/myk9q_logo_no_text_crop.png',
                        width: 300.0,
                        height: 300.0,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                )
              : PLoginWidget(),
        ),
        FFRoute(
          name: PLoginWidget.routeName,
          path: PLoginWidget.routePath,
          builder: (context, params) => PLoginWidget(),
        ),
        FFRoute(
          name: PClassListTabsWidget.routeName,
          path: PClassListTabsWidget.routePath,
          builder: (context, params) => PClassListTabsWidget(
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PSettingsWidget.routeName,
          path: PSettingsWidget.routePath,
          builder: (context, params) => PSettingsWidget(),
        ),
        FFRoute(
          name: PAnnouncementsWidget.routeName,
          path: PAnnouncementsWidget.routePath,
          builder: (context, params) => PAnnouncementsWidget(
            popBack: params.getParam(
              'popBack',
              ParamType.bool,
            ),
          ),
        ),
        FFRoute(
          name: PScoresheetAKCScentWorkWidget.routeName,
          path: PScoresheetAKCScentWorkWidget.routePath,
          builder: (context, params) => PScoresheetAKCScentWorkWidget(
            ppEntryRow: params.getParam<ViewEntryClassJoinDistinctRow>(
              'ppEntryRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PScoresheetUKCNoseworkWidget.routeName,
          path: PScoresheetUKCNoseworkWidget.routePath,
          builder: (context, params) => PScoresheetUKCNoseworkWidget(
            ppEntryRow: params.getParam<ViewEntryClassJoinDistinctRow>(
              'ppEntryRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PEntryListTabsWidget.routeName,
          path: PEntryListTabsWidget.routePath,
          builder: (context, params) => PEntryListTabsWidget(
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PEntryListAllWidget.routeName,
          path: PEntryListAllWidget.routePath,
          builder: (context, params) => PEntryListAllWidget(
            ppArmband: params.getParam(
              'ppArmband',
              ParamType.int,
            ),
            ppCallName: params.getParam(
              'ppCallName',
              ParamType.String,
            ),
            ppBreed: params.getParam(
              'ppBreed',
              ParamType.String,
            ),
            ppHandler: params.getParam(
              'ppHandler',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: PHomeWidget.routeName,
          path: PHomeWidget.routePath,
          builder: (context, params) => PHomeWidget(),
        ),
        FFRoute(
          name: PShowDetailsWidget.routeName,
          path: PShowDetailsWidget.routePath,
          builder: (context, params) => PShowDetailsWidget(
            ppShowRow: params.getParam<TblShowQueueRow>(
              'ppShowRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PDonationWidget.routeName,
          path: PDonationWidget.routePath,
          builder: (context, params) => PDonationWidget(),
        ),
        FFRoute(
          name: PScoresheetUKCRallyWidget.routeName,
          path: PScoresheetUKCRallyWidget.routePath,
          builder: (context, params) => PScoresheetUKCRallyWidget(
            ppEntryRow: params.getParam<ViewEntryClassJoinSectionDistinctRow>(
              'ppEntryRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PScoresheetUKCObedienceWidget.routeName,
          path: PScoresheetUKCObedienceWidget.routePath,
          builder: (context, params) => PScoresheetUKCObedienceWidget(
            ppEntryRow: params.getParam<ViewEntryClassJoinSectionDistinctRow>(
              'ppEntryRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PScoresheetASCAScentWidget.routeName,
          path: PScoresheetASCAScentWidget.routePath,
          builder: (context, params) => PScoresheetASCAScentWidget(
            ppEntryRow: params.getParam<ViewEntryClassJoinDistinctRow>(
              'ppEntryRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PScoresheetAKCFastCatWidget.routeName,
          path: PScoresheetAKCFastCatWidget.routePath,
          builder: (context, params) => PScoresheetAKCFastCatWidget(
            ppEntryRow: params.getParam<ViewEntryClassJoinDistinctRow>(
              'ppEntryRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PEntryListTabsSeperateSectionWidget.routeName,
          path: PEntryListTabsSeperateSectionWidget.routePath,
          builder: (context, params) => PEntryListTabsSeperateSectionWidget(
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PShowListWidget.routeName,
          path: PShowListWidget.routePath,
          builder: (context, params) => PShowListWidget(),
        ),
        FFRoute(
          name: PMaxTimeStopWatchWidget.routeName,
          path: PMaxTimeStopWatchWidget.routePath,
          builder: (context, params) => PMaxTimeStopWatchWidget(
            ppEntryRow: params.getParam<ViewEntryClassJoinDistinctRow>(
              'ppEntryRow',
              ParamType.SupabaseRow,
            ),
          ),
        ),
        FFRoute(
          name: PScoresheetAKCScentNationalWidget.routeName,
          path: PScoresheetAKCScentNationalWidget.routePath,
          builder: (context, params) => PScoresheetAKCScentNationalWidget(
            ppEntryRow: params.getParam<ViewEntryClassJoinDistinctRow>(
              'ppEntryRow',
              ParamType.SupabaseRow,
            ),
            ppClassRow: params.getParam<TblClassQueueRow>(
              'ppClassRow',
              ParamType.SupabaseRow,
            ),
            ppTrialRow: params.getParam<TblTrialQueueRow>(
              'ppTrialRow',
              ParamType.SupabaseRow,
            ),
          ),
        )
      ].map((r) => r.toRoute(appStateNotifier)).toList(),
    );

extension NavParamExtensions on Map<String, String?> {
  Map<String, String> get withoutNulls => Map.fromEntries(
        entries
            .where((e) => e.value != null)
            .map((e) => MapEntry(e.key, e.value!)),
      );
}

extension NavigationExtensions on BuildContext {
  void safePop() {
    // If there is only one route on the stack, navigate to the initial
    // page instead of popping.
    if (canPop()) {
      pop();
    } else {
      go('/');
    }
  }
}

extension _GoRouterStateExtensions on GoRouterState {
  Map<String, dynamic> get extraMap =>
      extra != null ? extra as Map<String, dynamic> : {};
  Map<String, dynamic> get allParams => <String, dynamic>{}
    ..addAll(pathParameters)
    ..addAll(uri.queryParameters)
    ..addAll(extraMap);
  TransitionInfo get transitionInfo => extraMap.containsKey(kTransitionInfoKey)
      ? extraMap[kTransitionInfoKey] as TransitionInfo
      : TransitionInfo.appDefault();
}

class FFParameters {
  FFParameters(this.state, [this.asyncParams = const {}]);

  final GoRouterState state;
  final Map<String, Future<dynamic> Function(String)> asyncParams;

  Map<String, dynamic> futureParamValues = {};

  // Parameters are empty if the params map is empty or if the only parameter
  // present is the special extra parameter reserved for the transition info.
  bool get isEmpty =>
      state.allParams.isEmpty ||
      (state.allParams.length == 1 &&
          state.extraMap.containsKey(kTransitionInfoKey));
  bool isAsyncParam(MapEntry<String, dynamic> param) =>
      asyncParams.containsKey(param.key) && param.value is String;
  bool get hasFutures => state.allParams.entries.any(isAsyncParam);
  Future<bool> completeFutures() => Future.wait(
        state.allParams.entries.where(isAsyncParam).map(
          (param) async {
            final doc = await asyncParams[param.key]!(param.value)
                .onError((_, __) => null);
            if (doc != null) {
              futureParamValues[param.key] = doc;
              return true;
            }
            return false;
          },
        ),
      ).onError((_, __) => [false]).then((v) => v.every((e) => e));

  dynamic getParam<T>(
    String paramName,
    ParamType type, {
    bool isList = false,
  }) {
    if (futureParamValues.containsKey(paramName)) {
      return futureParamValues[paramName];
    }
    if (!state.allParams.containsKey(paramName)) {
      return null;
    }
    final param = state.allParams[paramName];
    // Got parameter from `extras`, so just directly return it.
    if (param is! String) {
      return param;
    }
    // Return serialized value.
    return deserializeParam<T>(
      param,
      type,
      isList,
    );
  }
}

class FFRoute {
  const FFRoute({
    required this.name,
    required this.path,
    required this.builder,
    this.requireAuth = false,
    this.asyncParams = const {},
    this.routes = const [],
  });

  final String name;
  final String path;
  final bool requireAuth;
  final Map<String, Future<dynamic> Function(String)> asyncParams;
  final Widget Function(BuildContext, FFParameters) builder;
  final List<GoRoute> routes;

  GoRoute toRoute(AppStateNotifier appStateNotifier) => GoRoute(
        name: name,
        path: path,
        pageBuilder: (context, state) {
          fixStatusBarOniOS16AndBelow(context);
          final ffParams = FFParameters(state, asyncParams);
          final page = ffParams.hasFutures
              ? FutureBuilder(
                  future: ffParams.completeFutures(),
                  builder: (context, _) => builder(context, ffParams),
                )
              : builder(context, ffParams);
          final child = page;

          final transitionInfo = state.transitionInfo;
          return transitionInfo.hasTransition
              ? CustomTransitionPage(
                  key: state.pageKey,
                  child: child,
                  transitionDuration: transitionInfo.duration,
                  transitionsBuilder:
                      (context, animation, secondaryAnimation, child) =>
                          PageTransition(
                    type: transitionInfo.transitionType,
                    duration: transitionInfo.duration,
                    reverseDuration: transitionInfo.duration,
                    alignment: transitionInfo.alignment,
                    child: child,
                  ).buildTransitions(
                    context,
                    animation,
                    secondaryAnimation,
                    child,
                  ),
                )
              : MaterialPage(key: state.pageKey, child: child);
        },
        routes: routes,
      );
}

class TransitionInfo {
  const TransitionInfo({
    required this.hasTransition,
    this.transitionType = PageTransitionType.fade,
    this.duration = const Duration(milliseconds: 300),
    this.alignment,
  });

  final bool hasTransition;
  final PageTransitionType transitionType;
  final Duration duration;
  final Alignment? alignment;

  static TransitionInfo appDefault() => TransitionInfo(
        hasTransition: true,
        transitionType: PageTransitionType.rightToLeft,
        duration: Duration(milliseconds: 300),
      );
}

class RootPageContext {
  const RootPageContext(this.isRootPage, [this.errorRoute]);
  final bool isRootPage;
  final String? errorRoute;

  static bool isInactiveRootPage(BuildContext context) {
    final rootPageContext = context.read<RootPageContext?>();
    final isRootPage = rootPageContext?.isRootPage ?? false;
    final location = GoRouterState.of(context).uri.toString();
    return isRootPage &&
        location != '/' &&
        location != rootPageContext?.errorRoute;
  }

  static Widget wrap(Widget child, {String? errorRoute}) => Provider.value(
        value: RootPageContext(true, errorRoute),
        child: child,
      );
}

extension GoRouterLocationExtension on GoRouter {
  String getCurrentLocation() {
    final RouteMatch lastMatch = routerDelegate.currentConfiguration.last;
    final RouteMatchList matchList = lastMatch is ImperativeRouteMatch
        ? lastMatch.matches
        : routerDelegate.currentConfiguration;
    return matchList.uri.toString();
  }
}
