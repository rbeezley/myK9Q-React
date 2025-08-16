import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'c_confirm_score_u_k_c_obedience_model.dart';
export 'c_confirm_score_u_k_c_obedience_model.dart';

class CConfirmScoreUKCObedienceWidget extends StatefulWidget {
  const CConfirmScoreUKCObedienceWidget({
    super.key,
    required this.cpResult,
    int? cpArmband,
    required this.cpClassRow,
    required this.cpTrialRow,
    required this.cpReason,
    required this.cpEntryRow,
    required this.cpScore,
  }) : this.cpArmband = cpArmband ?? 0;

  final String? cpResult;
  final int cpArmband;
  final TblClassQueueRow? cpClassRow;
  final TblTrialQueueRow? cpTrialRow;
  final String? cpReason;
  final ViewEntryClassJoinSectionDistinctRow? cpEntryRow;
  final String? cpScore;

  @override
  State<CConfirmScoreUKCObedienceWidget> createState() =>
      _CConfirmScoreUKCObedienceWidgetState();
}

class _CConfirmScoreUKCObedienceWidgetState
    extends State<CConfirmScoreUKCObedienceWidget>
    with TickerProviderStateMixin {
  late CConfirmScoreUKCObedienceModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CConfirmScoreUKCObedienceModel());

    animationsMap.addAll({
      'textOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 200.0.ms,
            duration: 600.0.ms,
            begin: Offset(0.0, 0.0),
            end: Offset(1.0, 1.0),
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

    return Container(
      width: double.infinity,
      height: 371.0,
      child: Stack(
        children: [
          Align(
            alignment: AlignmentDirectional(0.0, 0.0),
            child: Container(
              width: double.infinity,
              height: 279.0,
              constraints: BoxConstraints(
                maxWidth: 530.0,
              ),
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).secondaryBackground,
                boxShadow: [
                  BoxShadow(
                    blurRadius: 3.0,
                    color: Color(0x33000000),
                    offset: Offset(
                      0.0,
                      1.0,
                    ),
                  )
                ],
                borderRadius: BorderRadius.circular(24.0),
                border: Border.all(
                  color: FlutterFlowTheme.of(context).primary,
                  width: 10.0,
                ),
              ),
              child: Padding(
                padding: EdgeInsetsDirectional.fromSTEB(8.0, 50.0, 8.0, 0.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          Text(
                            valueOrDefault<String>(
                              widget.cpResult,
                              'Result',
                            ),
                            textAlign: TextAlign.center,
                            style: FlutterFlowTheme.of(context)
                                .titleMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .titleMediumFamily,
                                  fontSize: 24.0,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .titleMediumIsCustom,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.all(4.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if ((widget.cpResult == 'NQ') ||
                              (widget.cpResult == 'EX') ||
                              (widget.cpResult == 'WD'))
                            Text(
                              widget.cpReason!,
                              textAlign: TextAlign.center,
                              style: FlutterFlowTheme.of(context)
                                  .titleMedium
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .titleMediumFamily,
                                    color:
                                        FlutterFlowTheme.of(context).alternate,
                                    fontSize: 18.0,
                                    letterSpacing: 0.0,
                                    fontWeight: FontWeight.normal,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .titleMediumIsCustom,
                                  ),
                            ),
                        ],
                      ),
                    ),
                    if (widget.cpResult == 'Qualified')
                      Padding(
                        padding: EdgeInsets.all(4.0),
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            Text(
                              'Score: ${widget.cpScore}',
                              textAlign: TextAlign.center,
                              style: FlutterFlowTheme.of(context)
                                  .titleMedium
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .titleMediumFamily,
                                    fontSize: 24.0,
                                    letterSpacing: 0.0,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .titleMediumIsCustom,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          FFButtonWidget(
                            onPressed: () async {
                              Navigator.pop(context);
                            },
                            text: 'Cancel',
                            options: FFButtonOptions(
                              height: 40.0,
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  20.0, 0.0, 20.0, 0.0),
                              iconPadding: EdgeInsetsDirectional.fromSTEB(
                                  0.0, 0.0, 0.0, 0.0),
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              textStyle: FlutterFlowTheme.of(context)
                                  .bodyLarge
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodyLargeFamily,
                                    letterSpacing: 0.0,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodyLargeIsCustom,
                                  ),
                              elevation: 0.0,
                              borderSide: BorderSide(
                                color: FlutterFlowTheme.of(context).primary,
                              ),
                              borderRadius: BorderRadius.circular(40.0),
                            ),
                          ),
                          FFButtonWidget(
                            onPressed: () async {
                              HapticFeedback.heavyImpact();
                              await TblEntryQueueTable().update(
                                data: {
                                  'result_text': widget.cpResult,
                                  'reason': widget.cpReason,
                                  'is_scored': true,
                                  'in_ring': false,
                                  'search_time': '00:00.00',
                                  'score': widget.cpScore == null ||
                                          widget.cpScore == ''
                                      ? '0'
                                      : widget.cpScore,
                                },
                                matchingRows: (rows) => rows.eqOrNull(
                                  'id',
                                  widget.cpEntryRow?.id,
                                ),
                              );
                              await TblClassQueueTable().update(
                                data: {
                                  'class_status': 5,
                                  'class_status_comment': '-',
                                },
                                matchingRows: (rows) => rows
                                    .eqOrNull(
                                      'mobile_app_lic_key',
                                      FFAppState().asMobileAppLicKey,
                                    )
                                    .eqOrNull(
                                      'trial_date',
                                      widget.cpEntryRow?.trialDate,
                                    )
                                    .eqOrNull(
                                      'trial_number',
                                      widget.cpEntryRow?.trialNumber,
                                    )
                                    .eqOrNull(
                                      'element',
                                      widget.cpEntryRow?.element,
                                    )
                                    .eqOrNull(
                                      'level',
                                      widget.cpEntryRow?.level,
                                    )
                                    .eqOrNull(
                                      'section',
                                      widget.cpClassRow?.section,
                                    ),
                              );
                              await TblScoreTriggerTable().insert({
                                'mobile_app_lic_key':
                                    widget.cpEntryRow?.mobileAppLicKey,
                                'trial_date': widget.cpEntryRow?.trialDate,
                                'trial_number': widget.cpEntryRow?.trialNumber,
                                'element': widget.cpEntryRow?.element,
                                'level': widget.cpEntryRow?.level,
                                'section': widget.cpEntryRow?.section,
                              });

                              context.pushNamed(
                                PEntryListTabsSeperateSectionWidget.routeName,
                                queryParameters: {
                                  'ppTrialRow': serializeParam(
                                    widget.cpTrialRow,
                                    ParamType.SupabaseRow,
                                  ),
                                  'ppClassRow': serializeParam(
                                    widget.cpClassRow,
                                    ParamType.SupabaseRow,
                                  ),
                                }.withoutNulls,
                              );

                              Navigator.pop(context);
                            },
                            text: 'Confirm',
                            options: FFButtonOptions(
                              height: 40.0,
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  20.0, 0.0, 20.0, 0.0),
                              iconPadding: EdgeInsetsDirectional.fromSTEB(
                                  0.0, 0.0, 0.0, 0.0),
                              color: FlutterFlowTheme.of(context)
                                  .backgroundComponents,
                              textStyle: FlutterFlowTheme.of(context)
                                  .titleSmall
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .titleSmallFamily,
                                    color:
                                        FlutterFlowTheme.of(context).colorWhite,
                                    letterSpacing: 0.0,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .titleSmallIsCustom,
                                  ),
                              elevation: 0.0,
                              borderRadius: BorderRadius.circular(40.0),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Align(
            alignment: AlignmentDirectional(0.0, -1.0),
            child: Container(
              width: 100.0,
              height: 100.0,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).backgroundComponents,
                shape: BoxShape.circle,
                border: Border.all(
                  color: FlutterFlowTheme.of(context).backgroundComponents,
                  width: 8.0,
                ),
              ),
              child: Align(
                alignment: AlignmentDirectional(0.0, 0.0),
                child: Text(
                  valueOrDefault<String>(
                    widget.cpArmband.toString(),
                    '0',
                  ),
                  textAlign: TextAlign.center,
                  style: FlutterFlowTheme.of(context).titleLarge.override(
                        fontFamily:
                            FlutterFlowTheme.of(context).titleLargeFamily,
                        color: FlutterFlowTheme.of(context).colorWhite,
                        fontSize: 32.0,
                        letterSpacing: 0.0,
                        useGoogleFonts:
                            !FlutterFlowTheme.of(context).titleLargeIsCustom,
                      ),
                ).animateOnPageLoad(animationsMap['textOnPageLoadAnimation']!),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
