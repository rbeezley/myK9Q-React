import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_toggle_icon.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/actions/index.dart' as actions;
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:just_audio/just_audio.dart';
import 'package:provider/provider.dart';
import 'c_navigation_bar_model.dart';
export 'c_navigation_bar_model.dart';

class CNavigationBarWidget extends StatefulWidget {
  const CNavigationBarWidget({
    super.key,
    int? cpSelectedPageIndex,
  }) : this.cpSelectedPageIndex = cpSelectedPageIndex ?? 1;

  final int cpSelectedPageIndex;

  @override
  State<CNavigationBarWidget> createState() => _CNavigationBarWidgetState();
}

class _CNavigationBarWidgetState extends State<CNavigationBarWidget>
    with TickerProviderStateMixin {
  late CNavigationBarModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CNavigationBarModel());

    // On component load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      await actions.unsubscribe(
        'tbl_announcements',
      );
      await actions.subscribe(
        'tbl_announcements',
        () async {
          FFAppState().asUnreadDot = true;
          safeSetState(() {});
          _model.soundPlayer ??= AudioPlayer();
          if (_model.soundPlayer!.playing) {
            await _model.soundPlayer!.stop();
          }
          _model.soundPlayer!.setVolume(0.51);
          _model.soundPlayer!
              .setAsset('assets/audios/NewNotification.mp3')
              .then((_) => _model.soundPlayer!.play());
        },
      );
    });

    animationsMap.addAll({
      'dividerOnPageLoadAnimation1': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: Offset(0.6, 1.0),
            end: Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'dividerOnPageLoadAnimation2': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: Offset(0.6, 1.0),
            end: Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'dividerOnPageLoadAnimation3': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: Offset(0.6, 1.0),
            end: Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'dividerOnPageLoadAnimation4': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: Offset(0.6, 1.0),
            end: Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'dividerOnPageLoadAnimation5': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: Offset(0.6, 1.0),
            end: Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'dividerOnPageLoadAnimation6': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: Offset(0.6, 1.0),
            end: Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'dividerOnPageLoadAnimation7': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: Offset(0.6, 1.0),
            end: Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'dividerOnPageLoadAnimation8': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: Offset(0.6, 1.0),
            end: Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return Stack(
      children: [
        if (responsiveVisibility(
          context: context,
          tablet: false,
          tabletLandscape: false,
          desktop: false,
        ))
          Container(
            width: double.infinity,
            height: 70.0,
            decoration: BoxDecoration(
              color: FlutterFlowTheme.of(context).appBar,
              borderRadius: BorderRadius.circular(0.0),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.max,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Opacity(
                      opacity: widget.cpSelectedPageIndex == 1 ? 1.0 : 0.5,
                      child: FlutterFlowIconButton(
                        borderColor: Colors.transparent,
                        borderRadius: 30.0,
                        borderWidth: 0.0,
                        buttonSize: 45.0,
                        hoverColor: FlutterFlowTheme.of(context).secondary,
                        hoverIconColor: FlutterFlowTheme.of(context).colorWhite,
                        icon: Icon(
                          Icons.cottage_outlined,
                          color: FlutterFlowTheme.of(context).colorWhite,
                          size: 24.0,
                        ),
                        onPressed: () async {
                          HapticFeedback.heavyImpact();
                          if (FFAppState().asMobileAppLicKey != '') {
                            context.goNamed(
                              PHomeWidget.routeName,
                              extra: <String, dynamic>{
                                kTransitionInfoKey: TransitionInfo(
                                  hasTransition: true,
                                  transitionType: PageTransitionType.fade,
                                  duration: Duration(milliseconds: 0),
                                ),
                              },
                            );
                          } else {
                            if (Navigator.of(context).canPop()) {
                              context.pop();
                            }
                            context.pushNamed(
                              PLoginWidget.routeName,
                              extra: <String, dynamic>{
                                kTransitionInfoKey: TransitionInfo(
                                  hasTransition: true,
                                  transitionType: PageTransitionType.fade,
                                  duration: Duration(milliseconds: 0),
                                ),
                              },
                            );
                          }
                        },
                      ),
                    ),
                    if (widget.cpSelectedPageIndex == 1)
                      SizedBox(
                        width: 30.0,
                        child: Divider(
                          height: 2.0,
                          thickness: 2.0,
                          color: FlutterFlowTheme.of(context).colorWhite,
                        ),
                      ).animateOnPageLoad(
                          animationsMap['dividerOnPageLoadAnimation1']!),
                  ],
                ),
                Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Stack(
                      children: [
                        Opacity(
                          opacity: widget.cpSelectedPageIndex == 2 ? 1.0 : 0.5,
                          child: FlutterFlowIconButton(
                            borderColor: Colors.transparent,
                            borderRadius: 30.0,
                            borderWidth: 0.0,
                            buttonSize: 45.0,
                            hoverColor: FlutterFlowTheme.of(context).secondary,
                            hoverIconColor:
                                FlutterFlowTheme.of(context).colorWhite,
                            icon: Icon(
                              Icons.notifications_rounded,
                              color: FlutterFlowTheme.of(context).colorWhite,
                              size: 24.0,
                            ),
                            onPressed: () async {
                              HapticFeedback.heavyImpact();
                              FFAppState().asUnreadDot = false;
                              safeSetState(() {});
                              if (FFAppState().asMobileAppLicKey != '') {
                                context.goNamed(PAnnouncementsWidget.routeName);
                              } else {
                                if (Navigator.of(context).canPop()) {
                                  context.pop();
                                }
                                context.pushNamed(
                                  PLoginWidget.routeName,
                                  extra: <String, dynamic>{
                                    kTransitionInfoKey: TransitionInfo(
                                      hasTransition: true,
                                      transitionType: PageTransitionType.fade,
                                      duration: Duration(milliseconds: 0),
                                    ),
                                  },
                                );
                              }
                            },
                          ),
                        ),
                        if ((FFAppState().asUnreadDot == true) &&
                            (FFAppState().asActivePage != 'p_Announcements'))
                          Container(
                            width: 10.0,
                            height: 10.0,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context).error,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    if (widget.cpSelectedPageIndex == 2)
                      SizedBox(
                        width: 30.0,
                        child: Divider(
                          height: 2.0,
                          thickness: 2.0,
                          color: FlutterFlowTheme.of(context).colorWhite,
                        ),
                      ).animateOnPageLoad(
                          animationsMap['dividerOnPageLoadAnimation2']!),
                  ],
                ),
                Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Opacity(
                      opacity: widget.cpSelectedPageIndex == 3 ? 1.0 : 0.5,
                      child: FlutterFlowIconButton(
                        borderColor: Colors.transparent,
                        borderRadius: 30.0,
                        borderWidth: 0.0,
                        buttonSize: 45.0,
                        hoverColor: FlutterFlowTheme.of(context).secondary,
                        icon: Icon(
                          Icons.calendar_month,
                          color: FlutterFlowTheme.of(context).colorWhite,
                          size: 24.0,
                        ),
                        onPressed: () async {
                          HapticFeedback.heavyImpact();
                          if (FFAppState().asMobileAppLicKey != '') {
                            if (Navigator.of(context).canPop()) {
                              context.pop();
                            }
                            context.pushNamed(PShowListWidget.routeName);
                          } else {
                            if (Navigator.of(context).canPop()) {
                              context.pop();
                            }
                            context.pushNamed(
                              PLoginWidget.routeName,
                              extra: <String, dynamic>{
                                kTransitionInfoKey: TransitionInfo(
                                  hasTransition: true,
                                  transitionType: PageTransitionType.fade,
                                  duration: Duration(milliseconds: 0),
                                ),
                              },
                            );
                          }
                        },
                      ),
                    ),
                    if (widget.cpSelectedPageIndex == 3)
                      SizedBox(
                        width: 30.0,
                        child: Divider(
                          height: 2.0,
                          thickness: 2.0,
                          color: FlutterFlowTheme.of(context).colorWhite,
                        ),
                      ).animateOnPageLoad(
                          animationsMap['dividerOnPageLoadAnimation3']!),
                  ],
                ),
                Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Opacity(
                      opacity: widget.cpSelectedPageIndex == 4 ? 1.0 : 0.5,
                      child: FlutterFlowIconButton(
                        borderColor: Colors.transparent,
                        borderRadius: 30.0,
                        borderWidth: 0.0,
                        buttonSize: 45.0,
                        hoverColor: FlutterFlowTheme.of(context).secondary,
                        icon: Icon(
                          Icons.settings_outlined,
                          color: FlutterFlowTheme.of(context).colorWhite,
                          size: 24.0,
                        ),
                        onPressed: () async {
                          HapticFeedback.heavyImpact();
                          if (FFAppState().asMobileAppLicKey != '') {
                            context.goNamed(PSettingsWidget.routeName);
                          } else {
                            if (Navigator.of(context).canPop()) {
                              context.pop();
                            }
                            context.pushNamed(
                              PLoginWidget.routeName,
                              extra: <String, dynamic>{
                                kTransitionInfoKey: TransitionInfo(
                                  hasTransition: true,
                                  transitionType: PageTransitionType.fade,
                                  duration: Duration(milliseconds: 0),
                                ),
                              },
                            );
                          }
                        },
                      ),
                    ),
                    if (widget.cpSelectedPageIndex == 4)
                      SizedBox(
                        width: 30.0,
                        child: Divider(
                          height: 2.0,
                          thickness: 2.0,
                          color: FlutterFlowTheme.of(context).colorWhite,
                        ),
                      ).animateOnPageLoad(
                          animationsMap['dividerOnPageLoadAnimation4']!),
                  ],
                ),
                Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Opacity(
                      opacity: widget.cpSelectedPageIndex == 5 ? 1.0 : 0.5,
                      child: ToggleIcon(
                        onPressed: () async {
                          safeSetState(() => FFAppState().asDarkMode =
                              !FFAppState().asDarkMode);
                          HapticFeedback.heavyImpact();
                          setDarkModeSetting(
                            context,
                            FFAppState().asDarkMode
                                ? ThemeMode.dark
                                : ThemeMode.light,
                          );
                        },
                        value: FFAppState().asDarkMode,
                        onIcon: Icon(
                          Icons.light_mode,
                          color: FlutterFlowTheme.of(context).colorWhite,
                          size: 25.0,
                        ),
                        offIcon: Icon(
                          Icons.dark_mode,
                          color: FlutterFlowTheme.of(context).colorWhite,
                          size: 25.0,
                        ),
                      ),
                    ),
                  ],
                ),
                Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Opacity(
                      opacity: widget.cpSelectedPageIndex == 6 ? 1.0 : 0.5,
                      child: FlutterFlowIconButton(
                        borderColor: Colors.transparent,
                        borderRadius: 30.0,
                        borderWidth: 0.0,
                        buttonSize: 45.0,
                        hoverColor: FlutterFlowTheme.of(context).secondary,
                        icon: Icon(
                          Icons.logout,
                          color: FlutterFlowTheme.of(context).colorWhite,
                          size: 24.0,
                        ),
                        onPressed: () async {
                          HapticFeedback.heavyImpact();
                          await actions.unsubscribe(
                            'tbl_trial_queue',
                          );
                          await actions.unsubscribe(
                            'tbl_entry_queue',
                          );
                          await actions.unsubscribe(
                            'tbl_announcements',
                          );
                          FFAppState().asMobileAppLicKey = '';
                          FFAppState().asRole = '';
                          FFAppState().asOrg = 'akc';
                          FFAppState().asClubName = '';
                          safeSetState(() {});

                          context.goNamed(
                            PLoginWidget.routeName,
                            extra: <String, dynamic>{
                              kTransitionInfoKey: TransitionInfo(
                                hasTransition: true,
                                transitionType: PageTransitionType.fade,
                              ),
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ]
                  .divide(SizedBox(width: 16.0))
                  .addToStart(SizedBox(width: 16.0))
                  .addToEnd(SizedBox(width: 16.0)),
            ),
          ),
        if (responsiveVisibility(
          context: context,
          phone: false,
        ))
          Align(
            alignment: AlignmentDirectional(-1.0, 0.0),
            child: Container(
              width: 70.0,
              height: 440.0,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).appBar,
                borderRadius: BorderRadius.circular(0.0),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Opacity(
                        opacity: widget.cpSelectedPageIndex == 1 ? 1.0 : 0.5,
                        child: FlutterFlowIconButton(
                          borderColor: Colors.transparent,
                          borderRadius: 30.0,
                          borderWidth: 0.0,
                          buttonSize: 50.0,
                          hoverColor: FlutterFlowTheme.of(context).secondary,
                          hoverIconColor:
                              FlutterFlowTheme.of(context).colorWhite,
                          icon: Icon(
                            Icons.cottage_outlined,
                            color: FlutterFlowTheme.of(context).colorWhite,
                            size: 24.0,
                          ),
                          onPressed: () async {
                            HapticFeedback.heavyImpact();
                            if (FFAppState().asMobileAppLicKey != '') {
                              context.goNamed(
                                PHomeWidget.routeName,
                                extra: <String, dynamic>{
                                  kTransitionInfoKey: TransitionInfo(
                                    hasTransition: true,
                                    transitionType: PageTransitionType.fade,
                                    duration: Duration(milliseconds: 0),
                                  ),
                                },
                              );
                            } else {
                              if (Navigator.of(context).canPop()) {
                                context.pop();
                              }
                              context.pushNamed(
                                PLoginWidget.routeName,
                                extra: <String, dynamic>{
                                  kTransitionInfoKey: TransitionInfo(
                                    hasTransition: true,
                                    transitionType: PageTransitionType.fade,
                                    duration: Duration(milliseconds: 0),
                                  ),
                                },
                              );
                            }
                          },
                        ),
                      ),
                      if (widget.cpSelectedPageIndex == 1)
                        SizedBox(
                          width: 30.0,
                          child: Divider(
                            height: 2.0,
                            thickness: 2.0,
                            color: FlutterFlowTheme.of(context).colorWhite,
                          ),
                        ).animateOnPageLoad(
                            animationsMap['dividerOnPageLoadAnimation5']!),
                    ],
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        children: [
                          if (FFAppState().asUnreadDot == true)
                            Container(
                              width: 10.0,
                              height: 10.0,
                              decoration: BoxDecoration(
                                color: FlutterFlowTheme.of(context).error,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      Opacity(
                        opacity: widget.cpSelectedPageIndex == 2 ? 1.0 : 0.5,
                        child: FlutterFlowIconButton(
                          borderColor: Colors.transparent,
                          borderRadius: 30.0,
                          borderWidth: 0.0,
                          buttonSize: 50.0,
                          hoverColor: FlutterFlowTheme.of(context).secondary,
                          hoverIconColor:
                              FlutterFlowTheme.of(context).colorWhite,
                          icon: Icon(
                            Icons.notifications_rounded,
                            color: FlutterFlowTheme.of(context).colorWhite,
                            size: 24.0,
                          ),
                          onPressed: () async {
                            HapticFeedback.heavyImpact();
                            FFAppState().asUnreadDot = false;
                            safeSetState(() {});
                            if (FFAppState().asMobileAppLicKey != '') {
                              context.goNamed(PAnnouncementsWidget.routeName);
                            } else {
                              if (Navigator.of(context).canPop()) {
                                context.pop();
                              }
                              context.pushNamed(
                                PLoginWidget.routeName,
                                extra: <String, dynamic>{
                                  kTransitionInfoKey: TransitionInfo(
                                    hasTransition: true,
                                    transitionType: PageTransitionType.fade,
                                    duration: Duration(milliseconds: 0),
                                  ),
                                },
                              );
                            }
                          },
                        ),
                      ),
                      if (widget.cpSelectedPageIndex == 2)
                        SizedBox(
                          width: 30.0,
                          child: Divider(
                            height: 2.0,
                            thickness: 2.0,
                            color: FlutterFlowTheme.of(context).colorWhite,
                          ),
                        ).animateOnPageLoad(
                            animationsMap['dividerOnPageLoadAnimation6']!),
                    ],
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Opacity(
                        opacity: widget.cpSelectedPageIndex == 3 ? 1.0 : 0.5,
                        child: FlutterFlowIconButton(
                          borderColor: Colors.transparent,
                          borderRadius: 30.0,
                          borderWidth: 0.0,
                          buttonSize: 50.0,
                          hoverColor: FlutterFlowTheme.of(context).secondary,
                          icon: Icon(
                            Icons.calendar_month,
                            color: FlutterFlowTheme.of(context).colorWhite,
                            size: 24.0,
                          ),
                          onPressed: () async {
                            HapticFeedback.heavyImpact();
                            if (FFAppState().asMobileAppLicKey != '') {
                              context.goNamed(PShowListWidget.routeName);
                            } else {
                              if (Navigator.of(context).canPop()) {
                                context.pop();
                              }
                              context.pushNamed(
                                PLoginWidget.routeName,
                                extra: <String, dynamic>{
                                  kTransitionInfoKey: TransitionInfo(
                                    hasTransition: true,
                                    transitionType: PageTransitionType.fade,
                                    duration: Duration(milliseconds: 0),
                                  ),
                                },
                              );
                            }
                          },
                        ),
                      ),
                      if (widget.cpSelectedPageIndex == 3)
                        SizedBox(
                          width: 30.0,
                          child: Divider(
                            height: 2.0,
                            thickness: 2.0,
                            color: FlutterFlowTheme.of(context).colorWhite,
                          ),
                        ).animateOnPageLoad(
                            animationsMap['dividerOnPageLoadAnimation7']!),
                    ],
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Opacity(
                        opacity: widget.cpSelectedPageIndex == 4 ? 1.0 : 0.5,
                        child: FlutterFlowIconButton(
                          borderColor: Colors.transparent,
                          borderRadius: 30.0,
                          borderWidth: 0.0,
                          buttonSize: 50.0,
                          hoverColor: FlutterFlowTheme.of(context).secondary,
                          icon: Icon(
                            Icons.settings_outlined,
                            color: FlutterFlowTheme.of(context).colorWhite,
                            size: 24.0,
                          ),
                          onPressed: () async {
                            HapticFeedback.heavyImpact();
                            if (FFAppState().asMobileAppLicKey != '') {
                              context.goNamed(PSettingsWidget.routeName);
                            } else {
                              if (Navigator.of(context).canPop()) {
                                context.pop();
                              }
                              context.pushNamed(
                                PLoginWidget.routeName,
                                extra: <String, dynamic>{
                                  kTransitionInfoKey: TransitionInfo(
                                    hasTransition: true,
                                    transitionType: PageTransitionType.fade,
                                    duration: Duration(milliseconds: 0),
                                  ),
                                },
                              );
                            }
                          },
                        ),
                      ),
                      if (widget.cpSelectedPageIndex == 4)
                        SizedBox(
                          width: 30.0,
                          child: Divider(
                            height: 2.0,
                            thickness: 2.0,
                            color: FlutterFlowTheme.of(context).colorWhite,
                          ),
                        ).animateOnPageLoad(
                            animationsMap['dividerOnPageLoadAnimation8']!),
                    ],
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Opacity(
                        opacity: widget.cpSelectedPageIndex == 5 ? 1.0 : 0.5,
                        child: ToggleIcon(
                          onPressed: () async {
                            safeSetState(() => FFAppState().asDarkMode =
                                !FFAppState().asDarkMode);
                            setDarkModeSetting(
                              context,
                              FFAppState().asDarkMode
                                  ? ThemeMode.dark
                                  : ThemeMode.light,
                            );
                          },
                          value: FFAppState().asDarkMode,
                          onIcon: Icon(
                            Icons.light_mode,
                            color: FlutterFlowTheme.of(context).colorWhite,
                            size: 25.0,
                          ),
                          offIcon: Icon(
                            Icons.dark_mode,
                            color: FlutterFlowTheme.of(context).colorWhite,
                            size: 25.0,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Opacity(
                        opacity: widget.cpSelectedPageIndex == 5 ? 1.0 : 0.5,
                        child: FlutterFlowIconButton(
                          borderColor: Colors.transparent,
                          borderRadius: 30.0,
                          borderWidth: 0.0,
                          buttonSize: 50.0,
                          hoverColor: FlutterFlowTheme.of(context).secondary,
                          icon: Icon(
                            Icons.logout,
                            color: FlutterFlowTheme.of(context).colorWhite,
                            size: 24.0,
                          ),
                          onPressed: () async {
                            HapticFeedback.heavyImpact();
                            await actions.unsubscribe(
                              'tbl_trial_queue',
                            );
                            await actions.unsubscribe(
                              'tbl_entry_queue',
                            );
                            await actions.unsubscribe(
                              'tbl_announcements',
                            );
                            FFAppState().asMobileAppLicKey = '';
                            FFAppState().asRole = '';
                            FFAppState().asOrg = 'akc';
                            FFAppState().asClubName = '';
                            safeSetState(() {});

                            context.goNamed(
                              PLoginWidget.routeName,
                              extra: <String, dynamic>{
                                kTransitionInfoKey: TransitionInfo(
                                  hasTransition: true,
                                  transitionType: PageTransitionType.fade,
                                ),
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ]
                    .divide(SizedBox(height: 16.0))
                    .addToStart(SizedBox(height: 16.0))
                    .addToEnd(SizedBox(height: 16.0)),
              ),
            ),
          ),
      ],
    );
  }
}
