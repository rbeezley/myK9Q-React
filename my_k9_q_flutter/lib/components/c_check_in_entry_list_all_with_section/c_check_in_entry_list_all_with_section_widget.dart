import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'c_check_in_entry_list_all_with_section_model.dart';
export 'c_check_in_entry_list_all_with_section_model.dart';

class CCheckInEntryListAllWithSectionWidget extends StatefulWidget {
  const CCheckInEntryListAllWithSectionWidget({
    super.key,
    this.cpViewEntryClassRow,
    this.cpArmband,
    this.cpCallName,
    this.cpBreed,
    this.cpHandler,
    required this.cpOnTapAction,
  });

  final ViewEntryClassJoinSectionDistinctRow? cpViewEntryClassRow;
  final int? cpArmband;
  final String? cpCallName;
  final String? cpBreed;
  final String? cpHandler;
  final Future Function()? cpOnTapAction;

  @override
  State<CCheckInEntryListAllWithSectionWidget> createState() =>
      _CCheckInEntryListAllWithSectionWidgetState();
}

class _CCheckInEntryListAllWithSectionWidgetState
    extends State<CCheckInEntryListAllWithSectionWidget>
    with TickerProviderStateMixin {
  late CCheckInEntryListAllWithSectionModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CCheckInEntryListAllWithSectionModel());

    animationsMap.addAll({
      'columnOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 100.0.ms,
            duration: 600.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
          TiltEffect(
            curve: Curves.easeInOut,
            delay: 100.0.ms,
            duration: 600.0.ms,
            begin: Offset(0, 0.698),
            end: Offset(0, 0),
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
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: EdgeInsets.all(10.0),
          child: Container(
            width: 125.0,
            decoration: BoxDecoration(
              color: FlutterFlowTheme.of(context).secondaryBackground,
              boxShadow: [
                BoxShadow(
                  blurRadius: 4.0,
                  color: Color(0x33000000),
                  offset: Offset(
                    0.0,
                    2.0,
                  ),
                )
              ],
              borderRadius: BorderRadius.circular(12.0),
            ),
            child: Padding(
              padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 12.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding:
                        EdgeInsetsDirectional.fromSTEB(8.0, 24.0, 8.0, 8.0),
                    child: FFButtonWidget(
                      onPressed: () async {
                        HapticFeedback.heavyImpact();
                        FFAppState().asCheckinStatus = 0;
                        safeSetState(() {});
                        await widget.cpOnTapAction?.call();
                      },
                      text: 'None',
                      icon: FaIcon(
                        FontAwesomeIcons.ellipsisV,
                        size: 15.0,
                      ),
                      options: FFButtonOptions(
                        width: 128.0,
                        height: 40.0,
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconPadding: EdgeInsets.all(0.0),
                        iconColor: FlutterFlowTheme.of(context).secondaryText,
                        color: FlutterFlowTheme.of(context).accent3,
                        textStyle: FlutterFlowTheme.of(context)
                            .bodyLarge
                            .override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyLargeFamily,
                              color: FlutterFlowTheme.of(context).secondaryText,
                              fontSize: 14.0,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyLargeIsCustom,
                            ),
                        elevation: 2.0,
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 1.0,
                        ),
                        borderRadius: BorderRadius.circular(40.0),
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: FFButtonWidget(
                      onPressed: () async {
                        HapticFeedback.heavyImpact();
                        FFAppState().asCheckinStatus = 4;
                        safeSetState(() {});
                        await widget.cpOnTapAction?.call();
                      },
                      text: 'At Gate',
                      icon: Icon(
                        Icons.fence,
                        size: 15.0,
                      ),
                      options: FFButtonOptions(
                        width: 128.0,
                        height: 40.0,
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconPadding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconColor: FlutterFlowTheme.of(context).colorWhite,
                        color: FlutterFlowTheme.of(context).tertiary,
                        textStyle: FlutterFlowTheme.of(context)
                            .bodyLarge
                            .override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyLargeFamily,
                              color: FlutterFlowTheme.of(context).colorWhite,
                              fontSize: 14.0,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyLargeIsCustom,
                            ),
                        elevation: 2.0,
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 1.0,
                        ),
                        borderRadius: BorderRadius.circular(40.0),
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: FFButtonWidget(
                      onPressed: () async {
                        HapticFeedback.heavyImpact();
                        FFAppState().asCheckinStatus = 1;
                        safeSetState(() {});
                        await widget.cpOnTapAction?.call();
                      },
                      text: 'Check-in',
                      icon: Icon(
                        Icons.check_circle_rounded,
                        size: 15.0,
                      ),
                      options: FFButtonOptions(
                        width: 128.0,
                        height: 40.0,
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconPadding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconColor: FlutterFlowTheme.of(context).colorWhite,
                        color: Color(0xFF047B6A),
                        textStyle: FlutterFlowTheme.of(context)
                            .bodyLarge
                            .override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyLargeFamily,
                              color: FlutterFlowTheme.of(context).colorWhite,
                              fontSize: 14.0,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyLargeIsCustom,
                            ),
                        elevation: 2.0,
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 1.0,
                        ),
                        borderRadius: BorderRadius.circular(40.0),
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: FFButtonWidget(
                      onPressed: () async {
                        HapticFeedback.heavyImpact();
                        FFAppState().asCheckinStatus = 2;
                        safeSetState(() {});
                        await widget.cpOnTapAction?.call();
                      },
                      text: 'Conflict',
                      icon: Icon(
                        Icons.compare_arrows_rounded,
                        size: 15.0,
                      ),
                      options: FFButtonOptions(
                        width: 128.0,
                        height: 40.0,
                        padding: EdgeInsets.all(0.0),
                        iconPadding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconColor: FlutterFlowTheme.of(context).colorWhite,
                        color: Color(0xFFFFAB40),
                        textStyle: FlutterFlowTheme.of(context)
                            .bodyLarge
                            .override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyLargeFamily,
                              color: FlutterFlowTheme.of(context).colorWhite,
                              fontSize: 14.0,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyLargeIsCustom,
                            ),
                        elevation: 2.0,
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 1.0,
                        ),
                        borderRadius: BorderRadius.circular(40.0),
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: FFButtonWidget(
                      onPressed: () async {
                        HapticFeedback.heavyImpact();
                        FFAppState().asCheckinStatus = 3;
                        safeSetState(() {});
                        await widget.cpOnTapAction?.call();
                      },
                      text: 'Pulled',
                      icon: Icon(
                        Icons.remove_done_rounded,
                        size: 15.0,
                      ),
                      options: FFButtonOptions(
                        width: 128.0,
                        height: 40.0,
                        padding: EdgeInsets.all(0.0),
                        iconPadding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconColor: FlutterFlowTheme.of(context).colorWhite,
                        color: FlutterFlowTheme.of(context).alternate,
                        textStyle: FlutterFlowTheme.of(context)
                            .bodyLarge
                            .override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyLargeFamily,
                              color: FlutterFlowTheme.of(context).colorWhite,
                              fontSize: 14.0,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyLargeIsCustom,
                            ),
                        elevation: 2.0,
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 1.0,
                        ),
                        borderRadius: BorderRadius.circular(40.0),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    ).animateOnPageLoad(animationsMap['columnOnPageLoadAnimation']!);
  }
}
