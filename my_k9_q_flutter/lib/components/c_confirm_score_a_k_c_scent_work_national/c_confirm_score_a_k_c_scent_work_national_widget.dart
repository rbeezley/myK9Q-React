import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'c_confirm_score_a_k_c_scent_work_national_model.dart';
export 'c_confirm_score_a_k_c_scent_work_national_model.dart';

class CConfirmScoreAKCScentWorkNationalWidget extends StatefulWidget {
  const CConfirmScoreAKCScentWorkNationalWidget({
    super.key,
    required this.cpResult,
    this.cpArea1,
    this.cpArea2,
    this.cpArea3,
    int? cpFaults,
    int? cpArmband,
    this.cpClassRow,
    this.cpTrialRow,
    required this.cpReason,
    this.cpEntryRow,
    this.cpCounter,
    int? cpCorrectCount,
    int? cpIncorrectCount,
    int? cpNoFinish,
  })  : this.cpFaults = cpFaults ?? 0,
        this.cpArmband = cpArmband ?? 0,
        this.cpCorrectCount = cpCorrectCount ?? 0,
        this.cpIncorrectCount = cpIncorrectCount ?? 0,
        this.cpNoFinish = cpNoFinish ?? 0;

  final String? cpResult;
  final String? cpArea1;
  final String? cpArea2;
  final String? cpArea3;
  final int cpFaults;
  final int cpArmband;
  final TblClassQueueRow? cpClassRow;
  final TblTrialQueueRow? cpTrialRow;
  final String? cpReason;
  final ViewEntryClassJoinDistinctRow? cpEntryRow;
  final int? cpCounter;
  final int cpCorrectCount;
  final int cpIncorrectCount;
  final int cpNoFinish;

  @override
  State<CConfirmScoreAKCScentWorkNationalWidget> createState() =>
      _CConfirmScoreAKCScentWorkNationalWidgetState();
}

class _CConfirmScoreAKCScentWorkNationalWidgetState
    extends State<CConfirmScoreAKCScentWorkNationalWidget>
    with TickerProviderStateMixin {
  late CConfirmScoreAKCScentWorkNationalModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model =
        createModel(context, () => CConfirmScoreAKCScentWorkNationalModel());

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
      height: 550.0,
      child: Stack(
        children: [
          Align(
            alignment: AlignmentDirectional(0.0, 1.0),
            child: Container(
              width: double.infinity,
              height: 450.0,
              constraints: BoxConstraints(
                minHeight: 500.0,
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
                padding: EdgeInsetsDirectional.fromSTEB(8.0, 40.0, 8.0, 8.0),
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                0.0, 0.0, 8.0, 0.0),
                            child: Text(
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
                                    color: widget.cpResult == 'Qualified'
                                        ? FlutterFlowTheme.of(context).tertiary
                                        : FlutterFlowTheme.of(context).primary,
                                    fontSize: 24.0,
                                    letterSpacing: 0.0,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .titleMediumIsCustom,
                                  ),
                            ),
                          ),
                          if ((widget.cpResult == 'NQ') ||
                              (widget.cpResult == 'EX') ||
                              (widget.cpResult == 'WD'))
                            Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  8.0, 0.0, 8.0, 0.0),
                              child: Text(
                                widget.cpReason!,
                                textAlign: TextAlign.center,
                                style: FlutterFlowTheme.of(context)
                                    .titleMedium
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .titleMediumFamily,
                                      color: FlutterFlowTheme.of(context)
                                          .alternate,
                                      fontSize: 20.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.normal,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .titleMediumIsCustom,
                                    ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Correct: ${valueOrDefault<String>(
                              widget.cpCorrectCount.toString(),
                              '0',
                            )}',
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .bodyMediumFamily,
                                  color: FlutterFlowTheme.of(context).tertiary,
                                  fontSize: 24.0,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .bodyMediumIsCustom,
                                ),
                          ),
                          Text(
                            'Incorrect: ${valueOrDefault<String>(
                              widget.cpIncorrectCount.toString(),
                              '0',
                            )}',
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .bodyMediumFamily,
                                  color: FlutterFlowTheme.of(context).alternate,
                                  fontSize: 24.0,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .bodyMediumIsCustom,
                                ),
                          ),
                        ].divide(SizedBox(width: 24.0)),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Faults: ${valueOrDefault<String>(
                              widget.cpFaults.toString(),
                              '0',
                            )}',
                            style: FlutterFlowTheme.of(context)
                                .titleMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .titleMediumFamily,
                                  color: FlutterFlowTheme.of(context).alternate,
                                  fontSize: 24.0,
                                  letterSpacing: 0.0,
                                  fontWeight: FontWeight.w600,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .titleMediumIsCustom,
                                ),
                          ),
                          Text(
                            'No Finish: ${widget.cpNoFinish.toString()}',
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .bodyMediumFamily,
                                  color: FlutterFlowTheme.of(context).alternate,
                                  fontSize: 24.0,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .bodyMediumIsCustom,
                                ),
                          ),
                        ].divide(SizedBox(width: 24.0)),
                      ),
                    ),
                    if (widget.cpResult == 'Qualified')
                      Padding(
                        padding: EdgeInsets.all(8.0),
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            if (widget.cpArea1 != null &&
                                widget.cpArea1 != '')
                              Text(
                                '${() {
                                  if (widget.cpEntryRow?.element ==
                                      'Interior') {
                                    return 'Area 1:    ';
                                  } else if ((widget.cpEntryRow?.element ==
                                          'Handler Discrimination') &&
                                      (widget.cpEntryRow?.level == 'Master')) {
                                    return 'Area 1:   ';
                                  } else {
                                    return 'Search Time:  ';
                                  }
                                }()}${valueOrDefault<String>(
                                  widget.cpArea1,
                                  '00:00.00',
                                )}',
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
                      padding: EdgeInsets.all(8.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (widget.cpArea2 != '00:00.00')
                            Text(
                              'Area 2:  ${valueOrDefault<String>(
                                widget.cpArea2,
                                '00:00.00',
                              )}',
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
                    if (widget.cpArea2 != '00:00.00')
                      Flexible(
                        child: Padding(
                          padding: EdgeInsets.all(24.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Total  Time:  ${valueOrDefault<String>(
                                  functions.computeTotalSearchTime(
                                      valueOrDefault<String>(
                                        widget.cpArea1,
                                        '00:00.00',
                                      ),
                                      valueOrDefault<String>(
                                        widget.cpArea2,
                                        '00:00.00',
                                      ),
                                      valueOrDefault<String>(
                                        widget.cpArea3,
                                        '00:00.00',
                                      )),
                                  '00:00.00',
                                )}',
                                style: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodyMediumFamily,
                                      fontSize: 24.0,
                                      letterSpacing: 0.0,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodyMediumIsCustom,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        crossAxisAlignment: CrossAxisAlignment.center,
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
                              _model.matchingEntryRows =
                                  await TblEntryQueueTable().update(
                                data: {
                                  'result_text': widget.cpResult,
                                  'fault_count': widget.cpFaults,
                                  'reason': widget.cpReason,
                                  'is_scored': true,
                                  'in_ring': false,
                                  'areatime1': valueOrDefault<String>(
                                    widget.cpArea1,
                                    '00:00.00',
                                  ),
                                  'areatime2': valueOrDefault<String>(
                                    widget.cpArea2,
                                    '00:00.00',
                                  ),
                                  'areatime3': valueOrDefault<String>(
                                    widget.cpArea3,
                                    '00:00.00',
                                  ),
                                  'search_time':
                                      functions.computeTotalSearchTime(
                                          widget.cpArea1,
                                          widget.cpArea2,
                                          widget.cpArea3),
                                  'sort_order': 9999,
                                  'correct_count': widget.cpCorrectCount,
                                  'incorrect_count': widget.cpIncorrectCount,
                                  'no_finish': widget.cpNoFinish,
                                },
                                matchingRows: (rows) => rows.eqOrNull(
                                  'id',
                                  widget.cpEntryRow?.id,
                                ),
                                returnRows: true,
                              );
                              _model.matchingClassRows =
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
                                    ),
                                returnRows: true,
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
                                PEntryListTabsWidget.routeName,
                                queryParameters: {
                                  'ppClassRow': serializeParam(
                                    widget.cpClassRow,
                                    ParamType.SupabaseRow,
                                  ),
                                  'ppTrialRow': serializeParam(
                                    widget.cpTrialRow,
                                    ParamType.SupabaseRow,
                                  ),
                                }.withoutNulls,
                              );

                              Navigator.pop(context);

                              safeSetState(() {});
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
