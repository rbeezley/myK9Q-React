import '/backend/supabase/supabase.dart';
import '/components/c_alert_dialog_warning/c_alert_dialog_warning_widget.dart';
import '/components/c_confirm_score_a_k_c_scent_work_national/c_confirm_score_a_k_c_scent_work_national_widget.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_count_controller.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_timer.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/flutter_flow/instant_timer.dart';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:stop_watch_timer/stop_watch_timer.dart';
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:just_audio/just_audio.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:provider/provider.dart';
import 'p_scoresheet_a_k_c_scent_national_model.dart';
export 'p_scoresheet_a_k_c_scent_national_model.dart';

class PScoresheetAKCScentNationalWidget extends StatefulWidget {
  const PScoresheetAKCScentNationalWidget({
    super.key,
    required this.ppEntryRow,
    required this.ppClassRow,
    this.ppTrialRow,
  });

  final ViewEntryClassJoinDistinctRow? ppEntryRow;
  final TblClassQueueRow? ppClassRow;
  final TblTrialQueueRow? ppTrialRow;

  static String routeName = 'p_ScoresheetAKCScentNational';
  static String routePath = '/ScoresheetAKCScentNational';

  @override
  State<PScoresheetAKCScentNationalWidget> createState() =>
      _PScoresheetAKCScentNationalWidgetState();
}

class _PScoresheetAKCScentNationalWidgetState
    extends State<PScoresheetAKCScentNationalWidget> {
  late PScoresheetAKCScentNationalModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PScoresheetAKCScentNationalModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_ScoresheetASCAScent';
      safeSetState(() {});
      _model.timerMaxTimeController.timer.setPresetTime(
        mSec: () {
          if (widget.ppClassRow?.areas == 1) {
            return functions
                .convertTextTimeToMS(widget.ppEntryRow!.timeLimit!);
          } else if (widget.ppClassRow?.areas == 2) {
            return (_model.textFieldArea1TextController.text == ''
                ? functions.convertTextTimeToMS(widget.ppEntryRow!.timeLimit!)
                : (_model.textFieldArea2TextController.text == ''
                    ? functions
                        .convertTextTimeToMS(widget.ppEntryRow!.timeLimit2!)
                    : functions
                        .convertTextTimeToMS(widget.ppEntryRow!.timeLimit!)));
          } else {
            return (_model.textFieldArea1TextController.text == ''
                ? functions.convertTextTimeToMS(widget.ppEntryRow!.timeLimit!)
                : (_model.textFieldArea2TextController.text == ''
                    ? functions
                        .convertTextTimeToMS(widget.ppEntryRow!.timeLimit2!)
                    : functions
                        .convertTextTimeToMS(widget.ppEntryRow!.timeLimit!)));
          }
        }(),
        add: false,
      );
      _model.timerMaxTimeController.onResetTimer();

      _model.pgMaxTimeMS =
          functions.convertTextTimeToMS(widget.ppEntryRow!.timeLimit!);
      safeSetState(() {});
    });

    _model.textFieldArea1TextController ??= TextEditingController();
    _model.textFieldArea1FocusNode ??= FocusNode();

    _model.textFieldArea1Mask = MaskTextInputFormatter(mask: '##:##.##');
    _model.textFieldArea2TextController ??= TextEditingController();
    _model.textFieldArea2FocusNode ??= FocusNode();

    _model.textFieldArea2Mask = MaskTextInputFormatter(mask: '##:##.##');
    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: PopScope(
        canPop: false,
        child: Scaffold(
          key: scaffoldKey,
          backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
          appBar: AppBar(
            backgroundColor: FlutterFlowTheme.of(context).appBar,
            automaticallyImplyLeading: false,
            leading: FlutterFlowIconButton(
              borderColor: Colors.transparent,
              borderRadius: 30.0,
              borderWidth: 1.0,
              buttonSize: 60.0,
              icon: Icon(
                Icons.arrow_back_rounded,
                color: Colors.white,
                size: 30.0,
              ),
              onPressed: () async {
                HapticFeedback.heavyImpact();
                FFAppState().asStopButtonShown = false;
                FFAppState().asArea1Error = false;
                FFAppState().asResultError = false;
                FFAppState().asNQError = false;
                FFAppState().asEXError = false;
                FFAppState().asDQError = false;
                safeSetState(() {});
                _model.timerSearchController.onStopTimer();
                _model.timerMaxTimeController.onStopTimer();
                await TblEntryQueueTable().update(
                  data: {
                    'in_ring': false,
                  },
                  matchingRows: (rows) => rows.eqOrNull(
                    'id',
                    widget.ppEntryRow?.id,
                  ),
                );

                context.pushNamed(
                  PEntryListTabsWidget.routeName,
                  queryParameters: {
                    'ppClassRow': serializeParam(
                      widget.ppClassRow,
                      ParamType.SupabaseRow,
                    ),
                    'ppTrialRow': serializeParam(
                      widget.ppTrialRow,
                      ParamType.SupabaseRow,
                    ),
                  }.withoutNulls,
                  extra: <String, dynamic>{
                    kTransitionInfoKey: TransitionInfo(
                      hasTransition: true,
                      transitionType: PageTransitionType.leftToRight,
                    ),
                  },
                );
              },
            ),
            title: Text(
              'AKC  Scent Work Nationals',
              style: FlutterFlowTheme.of(context).headlineMedium.override(
                    fontFamily:
                        FlutterFlowTheme.of(context).headlineMediumFamily,
                    color: Colors.white,
                    fontSize: 20.0,
                    letterSpacing: 0.0,
                    fontWeight: FontWeight.w500,
                    useGoogleFonts:
                        !FlutterFlowTheme.of(context).headlineMediumIsCustom,
                  ),
            ),
            actions: [],
            centerTitle: true,
            elevation: 2.0,
          ),
          body: SafeArea(
            top: true,
            child: Align(
              alignment: AlignmentDirectional(0.0, 0.0),
              child: Container(
                width: double.infinity,
                height: double.infinity,
                constraints: BoxConstraints(
                  maxWidth: 479.0,
                ),
                decoration: BoxDecoration(
                  color: FlutterFlowTheme.of(context).primaryBackground,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 8.0, 8.0, 0.0),
                        child: Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              borderRadius: BorderRadius.circular(8.0),
                              border: Border.all(
                                color:
                                    FlutterFlowTheme.of(context).primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      4.0, 4.0, 4.0, 0.0),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      SelectionArea(
                                          child: Text(
                                        valueOrDefault<String>(
                                          widget.ppEntryRow?.trialDate,
                                          'Trial Date',
                                        ),
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      )),
                                    ],
                                  ),
                                ),
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      4.0, 4.0, 4.0, 0.0),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.max,
                                    children: [
                                      Padding(
                                        padding: EdgeInsetsDirectional.fromSTEB(
                                            0.0, 0.0, 4.0, 0.0),
                                        child: SelectionArea(
                                            child: Text(
                                          valueOrDefault<String>(
                                            widget.ppEntryRow?.trialNumber,
                                            'Trial Number',
                                          ),
                                          style: FlutterFlowTheme.of(context)
                                              .bodyMedium
                                              .override(
                                                fontFamily:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMediumFamily,
                                                letterSpacing: 0.0,
                                                useGoogleFonts:
                                                    !FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMediumIsCustom,
                                              ),
                                        )),
                                      ),
                                      Text(
                                        '${widget.ppEntryRow?.element} ${widget.ppEntryRow?.level} ${widget.ppEntryRow?.section}',
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  mainAxisSize: MainAxisSize.max,
                                  children: [
                                    Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding: EdgeInsets.all(8.0),
                                          child: Container(
                                            width: 60.0,
                                            height: 60.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .secondary,
                                              shape: BoxShape.circle,
                                            ),
                                            alignment:
                                                AlignmentDirectional(0.0, 0.1),
                                            child: Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.armband
                                                    ?.toString(),
                                                'Armband',
                                              ),
                                              textAlign: TextAlign.center,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .colorWhite,
                                                    fontSize: 22.0,
                                                    letterSpacing: 0.0,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumIsCustom,
                                                  ),
                                            ),
                                          ),
                                        ),
                                        Column(
                                          mainAxisSize: MainAxisSize.max,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.callName,
                                                'Call Name',
                                              ),
                                              textAlign: TextAlign.center,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    letterSpacing: 0.0,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumIsCustom,
                                                  ),
                                            ),
                                            Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.breed,
                                                'Breed',
                                              ),
                                              textAlign: TextAlign.center,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    fontSize: 12.0,
                                                    letterSpacing: 0.0,
                                                    fontWeight: FontWeight.w500,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumIsCustom,
                                                  ),
                                            ),
                                            Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.handler,
                                                'Handler',
                                              ),
                                              textAlign: TextAlign.center,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    fontSize: 12.0,
                                                    letterSpacing: 0.0,
                                                    fontWeight: FontWeight.w500,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumIsCustom,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 8.0, 8.0, 0.0),
                        child: Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              borderRadius: BorderRadius.circular(8.0),
                              border: Border.all(
                                color:
                                    FlutterFlowTheme.of(context).primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(10.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 0.0, 12.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceEvenly,
                                      children: [
                                        Column(
                                          mainAxisSize: MainAxisSize.max,
                                          children: [
                                            FlutterFlowTimer(
                                              initialTime: _model
                                                  .timerSearchInitialTimeMs,
                                              getDisplayTime: (value) =>
                                                  StopWatchTimer.getDisplayTime(
                                                value,
                                                hours: false,
                                              ),
                                              controller:
                                                  _model.timerSearchController,
                                              updateStateInterval:
                                                  Duration(milliseconds: 1000),
                                              onChanged: (value, displayTime,
                                                  shouldUpdate) {
                                                _model.timerSearchMilliseconds =
                                                    value;
                                                _model.timerSearchValue =
                                                    displayTime;
                                                if (shouldUpdate)
                                                  safeSetState(() {});
                                              },
                                              textAlign: TextAlign.start,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    font: GoogleFonts.openSans(
                                                      fontWeight:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMedium
                                                              .fontWeight,
                                                      fontStyle:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMedium
                                                              .fontStyle,
                                                    ),
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    fontSize: 38.0,
                                                    letterSpacing: 0.0,
                                                    fontWeight:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMedium
                                                            .fontWeight,
                                                    fontStyle:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMedium
                                                            .fontStyle,
                                                  ),
                                            ),
                                            if ((widget
                                                        .ppEntryRow?.level !=
                                                    'Master') &&
                                                (_model.timerMaxTimeMilliseconds <=
                                                    31000) &&
                                                (_model.timerMaxTimeMilliseconds !=
                                                    00000))
                                              Text(
                                                '30 Second Warning',
                                                style: FlutterFlowTheme.of(
                                                        context)
                                                    .bodyMedium
                                                    .override(
                                                      fontFamily:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumFamily,
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .error,
                                                      fontSize: 14.0,
                                                      letterSpacing: 0.0,
                                                      useGoogleFonts:
                                                          !FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumIsCustom,
                                                    ),
                                              ),
                                            Builder(
                                              builder: (context) =>
                                                  FlutterFlowTimer(
                                                initialTime: functions
                                                    .convertTextTimeToMS(widget
                                                        .ppEntryRow!
                                                        .timeLimit!),
                                                getDisplayTime: (value) =>
                                                    StopWatchTimer
                                                        .getDisplayTime(
                                                  value,
                                                  hours: false,
                                                  milliSecond: false,
                                                ),
                                                controller: _model
                                                    .timerMaxTimeController,
                                                updateStateInterval: Duration(
                                                    milliseconds: 1000),
                                                onChanged: (value, displayTime,
                                                    shouldUpdate) {
                                                  _model.timerMaxTimeMilliseconds =
                                                      value;
                                                  _model.timerMaxTimeValue =
                                                      displayTime;
                                                  if (shouldUpdate)
                                                    safeSetState(() {});
                                                },
                                                onEnded: () async {
                                                  HapticFeedback.heavyImpact();
                                                  FFAppState()
                                                          .asStopButtonShown =
                                                      false;
                                                  safeSetState(() {});
                                                  _model.timerSearchController
                                                      .onStopTimer();
                                                  await showDialog(
                                                    context: context,
                                                    builder: (dialogContext) {
                                                      return Dialog(
                                                        elevation: 0,
                                                        insetPadding:
                                                            EdgeInsets.zero,
                                                        backgroundColor:
                                                            Colors.transparent,
                                                        alignment:
                                                            AlignmentDirectional(
                                                                    0.0, 0.0)
                                                                .resolve(
                                                                    Directionality.of(
                                                                        context)),
                                                        child: GestureDetector(
                                                          onTap: () {
                                                            FocusScope.of(
                                                                    dialogContext)
                                                                .unfocus();
                                                            FocusManager
                                                                .instance
                                                                .primaryFocus
                                                                ?.unfocus();
                                                          },
                                                          child:
                                                              CAlertDialogWarningWidget(
                                                            cpAlertTitle:
                                                                'Max Time Exceeded',
                                                            cpAlertMessage: ' ',
                                                          ),
                                                        ),
                                                      );
                                                    },
                                                  );
                                                },
                                                textAlign: TextAlign.start,
                                                style: FlutterFlowTheme.of(
                                                        context)
                                                    .bodyMedium
                                                    .override(
                                                      font:
                                                          GoogleFonts.openSans(
                                                        fontWeight:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .fontWeight,
                                                        fontStyle:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .fontStyle,
                                                      ),
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .tertiary,
                                                      fontSize: 0.0,
                                                      letterSpacing: 0.0,
                                                      fontWeight:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMedium
                                                              .fontWeight,
                                                      fontStyle:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMedium
                                                              .fontStyle,
                                                    ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        CircularPercentIndicator(
                                          percent: functions.maxTimeProgressBar(
                                              _model.pgMaxTimeMS,
                                              _model.timerMaxTimeMilliseconds),
                                          radius: 35.0,
                                          lineWidth: 8.0,
                                          animation: true,
                                          animateFromLastPercent: true,
                                          progressColor:
                                              (_model.timerMaxTimeMilliseconds <=
                                                          31000) &&
                                                      (widget.ppEntryRow
                                                              ?.level !=
                                                          'Master')
                                                  ? FlutterFlowTheme.of(context)
                                                      .error
                                                  : FlutterFlowTheme.of(context)
                                                      .tertiary,
                                          backgroundColor:
                                              FlutterFlowTheme.of(context)
                                                  .accent4,
                                          center: Text(
                                            _model.timerMaxTimeValue,
                                            style: FlutterFlowTheme.of(context)
                                                .headlineSmall
                                                .override(
                                                  fontFamily:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .headlineSmallFamily,
                                                  color:
                                                      (_model.timerMaxTimeMilliseconds <=
                                                                  31000) &&
                                                              (widget.ppEntryRow
                                                                      ?.level !=
                                                                  'Master')
                                                          ? FlutterFlowTheme.of(
                                                                  context)
                                                              .error
                                                          : FlutterFlowTheme.of(
                                                                  context)
                                                              .tertiary,
                                                  fontSize: 14.0,
                                                  letterSpacing: 0.0,
                                                  fontWeight: FontWeight.normal,
                                                  useGoogleFonts:
                                                      !FlutterFlowTheme.of(
                                                              context)
                                                          .headlineSmallIsCustom,
                                                ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 0.0, 12.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceEvenly,
                                      children: [
                                        Padding(
                                          padding:
                                              EdgeInsetsDirectional.fromSTEB(
                                                  0.0, 24.0, 0.0, 0.0),
                                          child: FFButtonWidget(
                                            onPressed: () async {
                                              HapticFeedback.heavyImpact();
                                              _model.timerSearchController
                                                  .onStopTimer();
                                              _model.timerMaxTimeController
                                                  .onStopTimer();
                                              FFAppState().asStopButtonShown =
                                                  false;
                                              safeSetState(() {});
                                            },
                                            text: '',
                                            icon: Icon(
                                              Icons
                                                  .pause_circle_outline_rounded,
                                              size: 28.0,
                                            ),
                                            options: FFButtonOptions(
                                              width: 50.0,
                                              height: 50.0,
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 0.0, 0.0),
                                              iconPadding: EdgeInsetsDirectional
                                                  .fromSTEB(8.0, 2.0, 0.0, 0.0),
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .backgroundComponents,
                                              textStyle:
                                                  FlutterFlowTheme.of(context)
                                                      .titleSmall
                                                      .override(
                                                        fontFamily:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .titleSmallFamily,
                                                        color: Colors.white,
                                                        fontSize: 20.0,
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .titleSmallIsCustom,
                                                      ),
                                              elevation: 2.0,
                                              borderRadius:
                                                  BorderRadius.circular(40.0),
                                            ),
                                            showLoadingIndicator: false,
                                          ),
                                        ),
                                        Builder(
                                          builder: (context) {
                                            if (FFAppState()
                                                .asStopButtonShown) {
                                              return Stack(
                                                children: [
                                                  FFButtonWidget(
                                                    onPressed: () async {
                                                      HapticFeedback
                                                          .heavyImpact();
                                                      _model
                                                          .timerSearchController
                                                          .onStopTimer();
                                                      _model
                                                          .timerMaxTimeController
                                                          .onStopTimer();
                                                      _model.soundPlayer
                                                          ?.stop();
                                                      FFAppState()
                                                              .asStopButtonShown =
                                                          false;
                                                      FFAppState()
                                                              .asPauseButtonShown =
                                                          false;
                                                      safeSetState(() {});
                                                      await Future.delayed(
                                                        Duration(
                                                          milliseconds: 250,
                                                        ),
                                                      );
                                                      if ((widget.ppEntryRow
                                                                  ?.element ==
                                                              'Interior') &&
                                                          (widget.ppEntryRow
                                                                  ?.level ==
                                                              'Excellent')) {
                                                        return;
                                                      }

                                                      if ((widget.ppEntryRow
                                                                  ?.element ==
                                                              'Interior') &&
                                                          (widget.ppEntryRow
                                                                  ?.level ==
                                                              'Master')) {
                                                        return;
                                                      }

                                                      if ((widget.ppEntryRow
                                                                  ?.element ==
                                                              'Handler Discrimination') &&
                                                          (widget.ppEntryRow
                                                                  ?.level ==
                                                              'Master')) {
                                                        return;
                                                      }

                                                      safeSetState(() {
                                                        _model.textFieldArea1TextController
                                                                ?.text =
                                                            _model
                                                                .timerSearchValue;
                                                        _model
                                                            .textFieldArea1Mask
                                                            .updateMask(
                                                          newValue:
                                                              TextEditingValue(
                                                            text: _model
                                                                .textFieldArea1TextController!
                                                                .text,
                                                          ),
                                                        );
                                                      });
                                                      return;
                                                    },
                                                    text: 'Stop',
                                                    icon: Icon(
                                                      Icons.stop_circle_rounded,
                                                      size: 28.0,
                                                    ),
                                                    options: FFButtonOptions(
                                                      width: 120.0,
                                                      height: 72.0,
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  0.0,
                                                                  0.0,
                                                                  0.0,
                                                                  0.0),
                                                      iconPadding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  0.0,
                                                                  0.0,
                                                                  0.0,
                                                                  0.0),
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .alternate,
                                                      textStyle:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .titleSmall
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleSmallFamily,
                                                                color: Colors
                                                                    .white,
                                                                fontSize: 20.0,
                                                                letterSpacing:
                                                                    0.0,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .titleSmallIsCustom,
                                                              ),
                                                      elevation: 2.0,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              30.0),
                                                    ),
                                                    showLoadingIndicator: false,
                                                  ),
                                                ],
                                              );
                                            } else {
                                              return FFButtonWidget(
                                                onPressed: () async {
                                                  HapticFeedback.heavyImpact();
                                                  _model.timerSearchController
                                                      .onStartTimer();
                                                  _model.timerMaxTimeController
                                                      .onStartTimer();
                                                  FFAppState()
                                                      .asStopButtonShown = true;
                                                  safeSetState(() {});
                                                  FFAppState()
                                                          .asPauseButtonShown =
                                                      true;
                                                  safeSetState(() {});
                                                  if (widget
                                                          .ppEntryRow?.level ==
                                                      'Master') {
                                                    return;
                                                  }

                                                  _model.instantTimer =
                                                      InstantTimer.periodic(
                                                    duration: Duration(
                                                        milliseconds: 5000),
                                                    callback: (timer) async {
                                                      if (_model
                                                              .timerMaxTimeMilliseconds <
                                                          33000) {
                                                        _model.instantTimer
                                                            ?.cancel();
                                                        HapticFeedback
                                                            .heavyImpact();
                                                        _model.soundPlayer ??=
                                                            AudioPlayer();
                                                        if (_model.soundPlayer!
                                                            .playing) {
                                                          await _model
                                                              .soundPlayer!
                                                              .stop();
                                                        }
                                                        _model.soundPlayer!
                                                            .setVolume(1.0);
                                                        await _model
                                                            .soundPlayer!
                                                            .setAsset(
                                                                'assets/audios/warning.mp3')
                                                            .then((_) => _model
                                                                .soundPlayer!
                                                                .play());

                                                        _model.soundPlayer
                                                            ?.stop();
                                                        return;
                                                      } else {
                                                        return;
                                                      }
                                                    },
                                                    startImmediately: false,
                                                  );
                                                },
                                                text: 'Start',
                                                icon: Icon(
                                                  Icons.play_circle_rounded,
                                                  size: 28.0,
                                                ),
                                                options: FFButtonOptions(
                                                  width: 120.0,
                                                  height: 72.0,
                                                  padding: EdgeInsetsDirectional
                                                      .fromSTEB(
                                                          0.0, 0.0, 0.0, 0.0),
                                                  iconPadding:
                                                      EdgeInsetsDirectional
                                                          .fromSTEB(0.0, 0.0,
                                                              0.0, 0.0),
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .tertiary,
                                                  textStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .titleSmall
                                                          .override(
                                                            fontFamily:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleSmallFamily,
                                                            color: Colors.white,
                                                            fontSize: 20.0,
                                                            letterSpacing: 0.0,
                                                            useGoogleFonts:
                                                                !FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleSmallIsCustom,
                                                          ),
                                                  elevation: 2.0,
                                                  borderSide: BorderSide(
                                                    color: Colors.transparent,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          30.0),
                                                ),
                                              );
                                            }
                                          },
                                        ),
                                        Padding(
                                          padding:
                                              EdgeInsetsDirectional.fromSTEB(
                                                  0.0, 24.0, 0.0, 0.0),
                                          child: FFButtonWidget(
                                            onPressed:
                                                FFAppState().asStopButtonShown
                                                    ? null
                                                    : () async {
                                                        HapticFeedback
                                                            .heavyImpact();
                                                        _model
                                                            .timerSearchController
                                                            .onResetTimer();

                                                        _model
                                                            .timerMaxTimeController
                                                            .timer
                                                            .setPresetTime(
                                                          mSec: () {
                                                            if (widget
                                                                    .ppClassRow
                                                                    ?.areas ==
                                                                1) {
                                                              return functions
                                                                  .convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!);
                                                            } else if (widget
                                                                    .ppClassRow
                                                                    ?.areas ==
                                                                2) {
                                                              return (_model.textFieldArea1TextController
                                                                              .text ==
                                                                          ''
                                                                  ? functions.convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!)
                                                                  : (_model.textFieldArea2TextController.text ==
                                                                              ''
                                                                      ? functions.convertTextTimeToMS(widget
                                                                          .ppEntryRow!
                                                                          .timeLimit2!)
                                                                      : functions.convertTextTimeToMS(widget
                                                                          .ppEntryRow!
                                                                          .timeLimit!)));
                                                            } else {
                                                              return functions
                                                                  .convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!);
                                                            }
                                                          }(),
                                                          add: false,
                                                        );
                                                        _model
                                                            .timerMaxTimeController
                                                            .onResetTimer();

                                                        FFAppState()
                                                                .asStopButtonShown =
                                                            false;
                                                        safeSetState(() {});
                                                        _model.pgMaxTimeMS =
                                                            () {
                                                          if (widget.ppClassRow
                                                                  ?.areas ==
                                                              1) {
                                                            return functions
                                                                .convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!);
                                                          } else if (widget
                                                                  .ppClassRow
                                                                  ?.areas ==
                                                              2) {
                                                            return (_model.textFieldArea1TextController
                                                                            .text ==
                                                                        ''
                                                                ? functions.convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!)
                                                                : (_model.textFieldArea2TextController
                                                                                .text ==
                                                                            ''
                                                                    ? functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit2!)
                                                                    : functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit!)));
                                                          } else {
                                                            return functions
                                                                .convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!);
                                                          }
                                                        }();
                                                        safeSetState(() {});
                                                      },
                                            text: '',
                                            icon: Icon(
                                              Icons.restore,
                                              size: 28.0,
                                            ),
                                            options: FFButtonOptions(
                                              width: 50.0,
                                              height: 50.0,
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 0.0, 0.0),
                                              iconPadding: EdgeInsetsDirectional
                                                  .fromSTEB(6.0, 2.0, 0.0, 0.0),
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .backgroundComponents,
                                              textStyle:
                                                  FlutterFlowTheme.of(context)
                                                      .titleSmall
                                                      .override(
                                                        fontFamily:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .titleSmallFamily,
                                                        color: Colors.white,
                                                        fontSize: 20.0,
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .titleSmallIsCustom,
                                                      ),
                                              elevation: 2.0,
                                              borderRadius:
                                                  BorderRadius.circular(100.0),
                                            ),
                                            showLoadingIndicator: false,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 16.0, 0.0, 0.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        if (functions.useThisArea(
                                            2,
                                            widget.ppEntryRow?.element,
                                            widget.ppEntryRow?.level))
                                          FFButtonWidget(
                                            onPressed:
                                                (_model.textFieldArea1TextController
                                                                .text !=
                                                            '')
                                                    ? null
                                                    : () async {
                                                        HapticFeedback
                                                            .heavyImpact();
                                                        safeSetState(() {
                                                          _model.textFieldArea1TextController
                                                                  ?.text =
                                                              _model
                                                                  .timerSearchValue;
                                                          _model
                                                              .textFieldArea1Mask
                                                              .updateMask(
                                                            newValue:
                                                                TextEditingValue(
                                                              text: _model
                                                                  .textFieldArea1TextController!
                                                                  .text,
                                                            ),
                                                          );
                                                        });
                                                        FFAppState()
                                                                .asArea1Value =
                                                            _model
                                                                .timerSearchMilliseconds
                                                                .toString();
                                                        FFAppState()
                                                                .asAreaActive =
                                                            functions.theNextArea(
                                                                FFAppState()
                                                                    .asAreaCount,
                                                                1);
                                                        FFAppState()
                                                            .update(() {});
                                                        _model
                                                            .timerSearchController
                                                            .onResetTimer();

                                                        _model
                                                            .timerMaxTimeController
                                                            .timer
                                                            .setPresetTime(
                                                          mSec: () {
                                                            if (widget
                                                                    .ppClassRow
                                                                    ?.areas ==
                                                                1) {
                                                              return functions
                                                                  .convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!);
                                                            } else if (widget
                                                                    .ppClassRow
                                                                    ?.areas ==
                                                                2) {
                                                              return (_model.textFieldArea1TextController
                                                                              .text ==
                                                                          ''
                                                                  ? functions.convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!)
                                                                  : (_model.textFieldArea2TextController.text ==
                                                                              ''
                                                                      ? functions.convertTextTimeToMS(widget
                                                                          .ppEntryRow!
                                                                          .timeLimit2!)
                                                                      : functions.convertTextTimeToMS(widget
                                                                          .ppEntryRow!
                                                                          .timeLimit!)));
                                                            } else {
                                                              return functions
                                                                  .convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!);
                                                            }
                                                          }(),
                                                          add: false,
                                                        );
                                                        _model
                                                            .timerMaxTimeController
                                                            .onResetTimer();

                                                        _model.pgMaxTimeMS =
                                                            () {
                                                          if (widget.ppClassRow
                                                                  ?.areas ==
                                                              1) {
                                                            return functions
                                                                .convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!);
                                                          } else if (widget
                                                                  .ppClassRow
                                                                  ?.areas ==
                                                              2) {
                                                            return (_model.textFieldArea1TextController
                                                                            .text ==
                                                                        ''
                                                                ? functions.convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!)
                                                                : (_model.textFieldArea2TextController
                                                                                .text ==
                                                                            ''
                                                                    ? functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit2!)
                                                                    : functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit!)));
                                                          } else {
                                                            return functions
                                                                .convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!);
                                                          }
                                                        }();
                                                        safeSetState(() {});
                                                      },
                                            text: 'Area 1',
                                            options: FFButtonOptions(
                                              width: 72.0,
                                              height: 35.0,
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 0.0, 0.0),
                                              iconPadding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 0.0, 0.0),
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .backgroundComponents,
                                              textStyle: FlutterFlowTheme.of(
                                                      context)
                                                  .labelLarge
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .labelLargeFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .colorWhite,
                                                    letterSpacing: 0.0,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .labelLargeIsCustom,
                                                  ),
                                              elevation: 2.0,
                                              borderSide: BorderSide(
                                                color: Colors.transparent,
                                                width: 1.0,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(40.0),
                                              disabledColor:
                                                  FlutterFlowTheme.of(context)
                                                      .grayIcon,
                                              disabledTextColor:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                            ),
                                          ),
                                        Expanded(
                                          child: Padding(
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    8.0, 0.0, 8.0, 0.0),
                                            child: TextFormField(
                                              controller: _model
                                                  .textFieldArea1TextController,
                                              focusNode: _model
                                                  .textFieldArea1FocusNode,
                                              onChanged: (_) =>
                                                  EasyDebounce.debounce(
                                                '_model.textFieldArea1TextController',
                                                Duration(milliseconds: 100),
                                                () async {
                                                  if (_model.textFieldArea1TextController
                                                              .text !=
                                                          '') {
                                                    FFAppState().asArea1Error =
                                                        false;
                                                    safeSetState(() {});
                                                  } else {
                                                    FFAppState().asArea1Error =
                                                        true;
                                                    safeSetState(() {});
                                                    _model
                                                        .timerMaxTimeController
                                                        .timer
                                                        .setPresetTime(
                                                      mSec: functions
                                                          .convertTextTimeToMS(
                                                              widget
                                                                  .ppEntryRow!
                                                                  .timeLimit!),
                                                      add: false,
                                                    );
                                                    _model
                                                        .timerMaxTimeController
                                                        .onResetTimer();
                                                  }
                                                },
                                              ),
                                              autofocus: false,
                                              obscureText: false,
                                              decoration: InputDecoration(
                                                isDense: true,
                                                labelText: 'Area 1 (MM:SS.HH)',
                                                labelStyle:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMedium
                                                        .override(
                                                          fontFamily:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMediumFamily,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          useGoogleFonts:
                                                              !FlutterFlowTheme
                                                                      .of(context)
                                                                  .bodyMediumIsCustom,
                                                        ),
                                                hintText: 'Enter Area 1 Time',
                                                enabledBorder:
                                                    OutlineInputBorder(
                                                  borderSide: BorderSide(
                                                    color: FFAppState()
                                                            .asArea1Error
                                                        ? FlutterFlowTheme.of(
                                                                context)
                                                            .error
                                                        : FlutterFlowTheme.of(
                                                                context)
                                                            .accent3,
                                                    width: 2.0,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                focusedBorder:
                                                    OutlineInputBorder(
                                                  borderSide: BorderSide(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .success,
                                                    width: 2.0,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                errorBorder: OutlineInputBorder(
                                                  borderSide: BorderSide(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .error,
                                                    width: 2.0,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                focusedErrorBorder:
                                                    OutlineInputBorder(
                                                  borderSide: BorderSide(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .error,
                                                    width: 2.0,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                filled: true,
                                                fillColor: (_model
                                                            .textFieldArea1FocusNode
                                                            ?.hasFocus ??
                                                        false)
                                                    ? FlutterFlowTheme.of(
                                                            context)
                                                        .primaryBackground
                                                    : FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryBackground,
                                                contentPadding:
                                                    EdgeInsetsDirectional
                                                        .fromSTEB(
                                                            8.0, 0.0, 0.0, 0.0),
                                                prefixIcon: Icon(
                                                  Icons.timer_sharp,
                                                ),
                                                suffixIcon: _model
                                                        .textFieldArea1TextController!
                                                        .text
                                                        .isNotEmpty
                                                    ? InkWell(
                                                        onTap: () async {
                                                          _model
                                                              .textFieldArea1TextController
                                                              ?.clear();
                                                          if (_model.textFieldArea1TextController
                                                                      .text !=
                                                                  '') {
                                                            FFAppState()
                                                                    .asArea1Error =
                                                                false;
                                                            safeSetState(() {});
                                                          } else {
                                                            FFAppState()
                                                                    .asArea1Error =
                                                                true;
                                                            safeSetState(() {});
                                                            _model
                                                                .timerMaxTimeController
                                                                .timer
                                                                .setPresetTime(
                                                              mSec: functions
                                                                  .convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!),
                                                              add: false,
                                                            );
                                                            _model
                                                                .timerMaxTimeController
                                                                .onResetTimer();
                                                          }

                                                          safeSetState(() {});
                                                        },
                                                        child: Icon(
                                                          Icons.clear,
                                                          color:
                                                              Color(0xFF757575),
                                                          size: 15.0,
                                                        ),
                                                      )
                                                    : null,
                                              ),
                                              style:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMedium
                                                      .override(
                                                        fontFamily:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMediumFamily,
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                              textAlign: TextAlign.start,
                                              keyboardType:
                                                  TextInputType.number,
                                              validator: _model
                                                  .textFieldArea1TextControllerValidator
                                                  .asValidator(context),
                                              inputFormatters: [
                                                _model.textFieldArea1Mask
                                              ],
                                            ),
                                          ),
                                        ),
                                        Text(
                                          valueOrDefault<String>(
                                            'Max: ${widget.ppEntryRow?.timeLimit}',
                                            '00:01',
                                          ),
                                          textAlign: TextAlign.center,
                                          style: FlutterFlowTheme.of(context)
                                              .bodyMedium
                                              .override(
                                                fontFamily:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMediumFamily,
                                                fontSize: 12.0,
                                                letterSpacing: 0.0,
                                                useGoogleFonts:
                                                    !FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMediumIsCustom,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (functions.useThisArea(
                                      2,
                                      widget.ppEntryRow?.element,
                                      widget.ppEntryRow?.level))
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          0.0, 12.0, 0.0, 0.0),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.max,
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          FFButtonWidget(
                                            onPressed:
                                                (_model.textFieldArea2TextController
                                                                .text !=
                                                            '')
                                                    ? null
                                                    : () async {
                                                        HapticFeedback
                                                            .heavyImpact();
                                                        safeSetState(() {
                                                          _model.textFieldArea2TextController
                                                                  ?.text =
                                                              _model
                                                                  .timerSearchValue;
                                                          _model
                                                              .textFieldArea2Mask
                                                              .updateMask(
                                                            newValue:
                                                                TextEditingValue(
                                                              text: _model
                                                                  .textFieldArea2TextController!
                                                                  .text,
                                                            ),
                                                          );
                                                        });
                                                        FFAppState()
                                                                .asArea2Value =
                                                            '020202';
                                                        FFAppState()
                                                                .asAreaActive =
                                                            functions.theNextArea(
                                                                FFAppState()
                                                                    .asAreaCount,
                                                                2);
                                                        FFAppState()
                                                            .update(() {});
                                                        _model
                                                            .timerSearchController
                                                            .onResetTimer();

                                                        _model
                                                            .timerMaxTimeController
                                                            .timer
                                                            .setPresetTime(
                                                          mSec: () {
                                                            if (widget
                                                                    .ppClassRow
                                                                    ?.areas ==
                                                                1) {
                                                              return functions
                                                                  .convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!);
                                                            } else if (widget
                                                                    .ppClassRow
                                                                    ?.areas ==
                                                                2) {
                                                              return (_model.textFieldArea1TextController
                                                                              .text ==
                                                                          ''
                                                                  ? functions.convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!)
                                                                  : (_model.textFieldArea2TextController.text ==
                                                                              ''
                                                                      ? functions.convertTextTimeToMS(widget
                                                                          .ppEntryRow!
                                                                          .timeLimit2!)
                                                                      : functions.convertTextTimeToMS(widget
                                                                          .ppEntryRow!
                                                                          .timeLimit!)));
                                                            } else {
                                                              return functions
                                                                  .convertTextTimeToMS(widget
                                                                      .ppEntryRow!
                                                                      .timeLimit!);
                                                            }
                                                          }(),
                                                          add: false,
                                                        );
                                                        _model
                                                            .timerMaxTimeController
                                                            .onResetTimer();

                                                        _model.pgMaxTimeMS =
                                                            () {
                                                          if (widget.ppClassRow
                                                                  ?.areas ==
                                                              1) {
                                                            return functions
                                                                .convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!);
                                                          } else if (widget
                                                                  .ppClassRow
                                                                  ?.areas ==
                                                              2) {
                                                            return (_model.textFieldArea1TextController
                                                                            .text ==
                                                                        ''
                                                                ? functions.convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!)
                                                                : (_model.textFieldArea2TextController
                                                                                .text ==
                                                                            ''
                                                                    ? functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit2!)
                                                                    : functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit!)));
                                                          } else {
                                                            return functions
                                                                .convertTextTimeToMS(widget
                                                                    .ppEntryRow!
                                                                    .timeLimit!);
                                                          }
                                                        }();
                                                        safeSetState(() {});
                                                      },
                                            text: 'Area 2',
                                            options: FFButtonOptions(
                                              width: 72.0,
                                              height: 35.0,
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 0.0, 0.0),
                                              iconPadding: EdgeInsets.all(0.0),
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .backgroundComponents,
                                              textStyle: FlutterFlowTheme.of(
                                                      context)
                                                  .labelLarge
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .labelLargeFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .colorWhite,
                                                    letterSpacing: 0.0,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .labelLargeIsCustom,
                                                  ),
                                              elevation: 2.0,
                                              borderSide: BorderSide(
                                                color: Colors.transparent,
                                                width: 1.0,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(40.0),
                                              disabledColor:
                                                  FlutterFlowTheme.of(context)
                                                      .grayIcon,
                                              disabledTextColor:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                            ),
                                          ),
                                          Expanded(
                                            child: Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(8.0, 0.0, 8.0, 0.0),
                                              child: TextFormField(
                                                controller: _model
                                                    .textFieldArea2TextController,
                                                focusNode: _model
                                                    .textFieldArea2FocusNode,
                                                onChanged: (_) =>
                                                    EasyDebounce.debounce(
                                                  '_model.textFieldArea2TextController',
                                                  Duration(milliseconds: 100),
                                                  () async {
                                                    if (_model.textFieldArea2TextController
                                                                .text !=
                                                            '') {
                                                      FFAppState()
                                                          .asArea2Error = false;
                                                      safeSetState(() {});
                                                    } else {
                                                      FFAppState()
                                                          .asArea2Error = true;
                                                      safeSetState(() {});
                                                      _model
                                                          .timerMaxTimeController
                                                          .timer
                                                          .setPresetTime(
                                                        mSec: functions
                                                            .convertTextTimeToMS(
                                                                widget
                                                                    .ppEntryRow!
                                                                    .timeLimit2!),
                                                        add: false,
                                                      );
                                                      _model
                                                          .timerMaxTimeController
                                                          .onResetTimer();
                                                    }
                                                  },
                                                ),
                                                autofocus: false,
                                                obscureText: false,
                                                decoration: InputDecoration(
                                                  isDense: true,
                                                  labelText:
                                                      'Area 2 (MM:SS.HH)',
                                                  labelStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMedium
                                                          .override(
                                                            fontFamily:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMediumFamily,
                                                            letterSpacing: 0.0,
                                                            fontWeight:
                                                                FontWeight.w500,
                                                            useGoogleFonts:
                                                                !FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMediumIsCustom,
                                                          ),
                                                  hintText: 'Enter Area 2 Time',
                                                  enabledBorder:
                                                      OutlineInputBorder(
                                                    borderSide: BorderSide(
                                                      color:
                                                          FFAppState()
                                                                  .asArea2Error
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .error
                                                              : FlutterFlowTheme
                                                                      .of(context)
                                                                  .accent3,
                                                      width: 2.0,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12.0),
                                                  ),
                                                  focusedBorder:
                                                      OutlineInputBorder(
                                                    borderSide: BorderSide(
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .success,
                                                      width: 2.0,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12.0),
                                                  ),
                                                  errorBorder:
                                                      OutlineInputBorder(
                                                    borderSide: BorderSide(
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .error,
                                                      width: 2.0,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12.0),
                                                  ),
                                                  focusedErrorBorder:
                                                      OutlineInputBorder(
                                                    borderSide: BorderSide(
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .error,
                                                      width: 2.0,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12.0),
                                                  ),
                                                  filled: true,
                                                  fillColor: (_model
                                                              .textFieldArea2FocusNode
                                                              ?.hasFocus ??
                                                          false)
                                                      ? FlutterFlowTheme.of(
                                                              context)
                                                          .primaryBackground
                                                      : FlutterFlowTheme.of(
                                                              context)
                                                          .secondaryBackground,
                                                  contentPadding:
                                                      EdgeInsetsDirectional
                                                          .fromSTEB(8.0, 0.0,
                                                              0.0, 0.0),
                                                  prefixIcon: Icon(
                                                    Icons.timer_sharp,
                                                  ),
                                                  suffixIcon: _model
                                                          .textFieldArea2TextController!
                                                          .text
                                                          .isNotEmpty
                                                      ? InkWell(
                                                          onTap: () async {
                                                            _model
                                                                .textFieldArea2TextController
                                                                ?.clear();
                                                            if (_model.textFieldArea2TextController
                                                                        .text !=
                                                                    '') {
                                                              FFAppState()
                                                                      .asArea2Error =
                                                                  false;
                                                              safeSetState(
                                                                  () {});
                                                            } else {
                                                              FFAppState()
                                                                      .asArea2Error =
                                                                  true;
                                                              safeSetState(
                                                                  () {});
                                                              _model
                                                                  .timerMaxTimeController
                                                                  .timer
                                                                  .setPresetTime(
                                                                mSec: functions
                                                                    .convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit2!),
                                                                add: false,
                                                              );
                                                              _model
                                                                  .timerMaxTimeController
                                                                  .onResetTimer();
                                                            }

                                                            safeSetState(() {});
                                                          },
                                                          child: Icon(
                                                            Icons.clear,
                                                            color: Color(
                                                                0xFF757575),
                                                            size: 15.0,
                                                          ),
                                                        )
                                                      : null,
                                                ),
                                                style:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMedium
                                                        .override(
                                                          fontFamily:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMediumFamily,
                                                          letterSpacing: 0.0,
                                                          useGoogleFonts:
                                                              !FlutterFlowTheme
                                                                      .of(context)
                                                                  .bodyMediumIsCustom,
                                                        ),
                                                textAlign: TextAlign.start,
                                                keyboardType:
                                                    TextInputType.number,
                                                validator: _model
                                                    .textFieldArea2TextControllerValidator
                                                    .asValidator(context),
                                                inputFormatters: [
                                                  _model.textFieldArea2Mask
                                                ],
                                              ),
                                            ),
                                          ),
                                          Text(
                                            valueOrDefault<String>(
                                              'Max: ${widget.ppEntryRow?.timeLimit2}',
                                              '00:02',
                                            ),
                                            textAlign: TextAlign.center,
                                            style: FlutterFlowTheme.of(context)
                                                .bodyMedium
                                                .override(
                                                  fontFamily:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMediumFamily,
                                                  fontSize: 12.0,
                                                  letterSpacing: 0.0,
                                                  useGoogleFonts:
                                                      !FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMediumIsCustom,
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
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 16.0, 8.0, 8.0),
                        child: Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              borderRadius: BorderRadius.circular(8.0),
                              border: Border.all(
                                color: FFAppState().asResultError
                                    ? FlutterFlowTheme.of(context).error
                                    : FlutterFlowTheme.of(context)
                                        .primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Align(
                              alignment: AlignmentDirectional(0.0, 0.0),
                              child: Padding(
                                padding: EdgeInsets.all(8.0),
                                child: FlutterFlowChoiceChips(
                                  options: [
                                    ChipData('Qualified'),
                                    ChipData('Absent'),
                                    ChipData('Excused')
                                  ],
                                  onChanged: (val) async {
                                    safeSetState(() =>
                                        _model.choiceChipsAKCValue =
                                            val?.firstOrNull);
                                    HapticFeedback.heavyImpact();
                                  },
                                  selectedChipStyle: ChipStyle(
                                    backgroundColor:
                                        FlutterFlowTheme.of(context)
                                            .backgroundComponents,
                                    textStyle: FlutterFlowTheme.of(context)
                                        .bodySmall
                                        .override(
                                          font: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w500,
                                            fontStyle:
                                                FlutterFlowTheme.of(context)
                                                    .bodySmall
                                                    .fontStyle,
                                          ),
                                          color: FlutterFlowTheme.of(context)
                                              .colorWhite,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w500,
                                          fontStyle:
                                              FlutterFlowTheme.of(context)
                                                  .bodySmall
                                                  .fontStyle,
                                        ),
                                    iconColor:
                                        FlutterFlowTheme.of(context).colorWhite,
                                    iconSize: 0.0,
                                    labelPadding: EdgeInsets.all(4.0),
                                    elevation: 3.0,
                                    borderRadius: BorderRadius.circular(12.0),
                                  ),
                                  unselectedChipStyle: ChipStyle(
                                    backgroundColor:
                                        FlutterFlowTheme.of(context)
                                            .primaryBackground,
                                    textStyle: FlutterFlowTheme.of(context)
                                        .bodySmall
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .bodySmallFamily,
                                          color: FlutterFlowTheme.of(context)
                                              .secondaryText,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w500,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .bodySmallIsCustom,
                                        ),
                                    iconColor: FlutterFlowTheme.of(context)
                                        .secondaryText,
                                    iconSize: 15.0,
                                    labelPadding: EdgeInsets.all(4.0),
                                    elevation: 1.0,
                                    borderRadius: BorderRadius.circular(12.0),
                                  ),
                                  chipSpacing: 16.0,
                                  rowSpacing: 16.0,
                                  multiselect: false,
                                  initialized:
                                      _model.choiceChipsAKCValue != null,
                                  alignment: WrapAlignment.spaceEvenly,
                                  controller:
                                      _model.choiceChipsAKCValueController ??=
                                          FormFieldController<List<String>>(
                                    ['Qualified'],
                                  ),
                                  wrapped: true,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      if (_model.choiceChipsAKCValue == 'Excused')
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              8.0, 0.0, 8.0, 8.0),
                          child: Material(
                            color: Colors.transparent,
                            elevation: 1.0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.0),
                            ),
                            child: Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: FlutterFlowTheme.of(context)
                                    .secondaryBackground,
                                borderRadius: BorderRadius.circular(8.0),
                                border: Border.all(
                                  color: FFAppState().asEXError
                                      ? FlutterFlowTheme.of(context).error
                                      : FlutterFlowTheme.of(context).accent4,
                                  width: 2.0,
                                ),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                children: [
                                  Align(
                                    alignment: AlignmentDirectional(0.0, 0.0),
                                    child: Padding(
                                      padding: EdgeInsets.all(8.0),
                                      child: FlutterFlowChoiceChips(
                                        options: [
                                          ChipData('Dog Eliminated in Area'),
                                          ChipData('Handler Request'),
                                          ChipData('Out of Control'),
                                          ChipData('Overly Stressed'),
                                          ChipData('Other')
                                        ],
                                        onChanged: (val) async {
                                          safeSetState(() =>
                                              _model.choiceChipsEXValue =
                                                  val?.firstOrNull);
                                          HapticFeedback.heavyImpact();
                                        },
                                        selectedChipStyle: ChipStyle(
                                          backgroundColor:
                                              FlutterFlowTheme.of(context)
                                                  .backgroundComponents,
                                          textStyle: FlutterFlowTheme.of(
                                                  context)
                                              .bodySmall
                                              .override(
                                                font: GoogleFonts.poppins(
                                                  fontWeight: FontWeight.w500,
                                                  fontStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodySmall
                                                          .fontStyle,
                                                ),
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .colorWhite,
                                                letterSpacing: 0.0,
                                                fontWeight: FontWeight.w500,
                                                fontStyle:
                                                    FlutterFlowTheme.of(context)
                                                        .bodySmall
                                                        .fontStyle,
                                              ),
                                          iconColor:
                                              FlutterFlowTheme.of(context)
                                                  .colorWhite,
                                          iconSize: 0.0,
                                          labelPadding: EdgeInsets.all(4.0),
                                          elevation: 3.0,
                                          borderRadius:
                                              BorderRadius.circular(12.0),
                                        ),
                                        unselectedChipStyle: ChipStyle(
                                          backgroundColor:
                                              FlutterFlowTheme.of(context)
                                                  .primaryBackground,
                                          textStyle: FlutterFlowTheme.of(
                                                  context)
                                              .bodyMedium
                                              .override(
                                                fontFamily:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMediumFamily,
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .secondaryText,
                                                letterSpacing: 0.0,
                                                fontWeight: FontWeight.w500,
                                                useGoogleFonts:
                                                    !FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMediumIsCustom,
                                              ),
                                          iconColor:
                                              FlutterFlowTheme.of(context)
                                                  .secondaryText,
                                          iconSize: 0.0,
                                          labelPadding: EdgeInsets.all(4.0),
                                          elevation: 1.0,
                                          borderRadius:
                                              BorderRadius.circular(12.0),
                                        ),
                                        chipSpacing: 12.0,
                                        rowSpacing: 12.0,
                                        multiselect: false,
                                        initialized:
                                            _model.choiceChipsEXValue != null,
                                        alignment: WrapAlignment.spaceEvenly,
                                        controller: _model
                                                .choiceChipsEXValueController ??=
                                            FormFieldController<List<String>>(
                                          ['Dog Eliminated in Area'],
                                        ),
                                        wrapped: true,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      if (_model.choiceChipsAKCValue == 'WD')
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              8.0, 0.0, 8.0, 8.0),
                          child: Material(
                            color: Colors.transparent,
                            elevation: 1.0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8.0),
                            ),
                            child: Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: FlutterFlowTheme.of(context)
                                    .secondaryBackground,
                                borderRadius: BorderRadius.circular(8.0),
                                border: Border.all(
                                  color: FFAppState().asWDError
                                      ? FlutterFlowTheme.of(context).error
                                      : FlutterFlowTheme.of(context)
                                          .primaryBorder,
                                  width: 2.0,
                                ),
                              ),
                              child: Align(
                                alignment: AlignmentDirectional(0.0, 0.0),
                                child: Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: FlutterFlowChoiceChips(
                                    options: [
                                      ChipData('In Season'),
                                      ChipData('Judge Change')
                                    ],
                                    onChanged: (val) async {
                                      safeSetState(() =>
                                          _model.choiceChipsWDValue =
                                              val?.firstOrNull);
                                      HapticFeedback.heavyImpact();
                                    },
                                    selectedChipStyle: ChipStyle(
                                      backgroundColor:
                                          FlutterFlowTheme.of(context)
                                              .backgroundComponents,
                                      textStyle: FlutterFlowTheme.of(context)
                                          .bodySmall
                                          .override(
                                            font: GoogleFonts.poppins(
                                              fontWeight: FontWeight.w500,
                                              fontStyle:
                                                  FlutterFlowTheme.of(context)
                                                      .bodySmall
                                                      .fontStyle,
                                            ),
                                            color: FlutterFlowTheme.of(context)
                                                .colorWhite,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.w500,
                                            fontStyle:
                                                FlutterFlowTheme.of(context)
                                                    .bodySmall
                                                    .fontStyle,
                                          ),
                                      iconColor: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      iconSize: 0.0,
                                      labelPadding: EdgeInsets.all(4.0),
                                      elevation: 3.0,
                                      borderRadius: BorderRadius.circular(12.0),
                                    ),
                                    unselectedChipStyle: ChipStyle(
                                      backgroundColor:
                                          FlutterFlowTheme.of(context)
                                              .primaryBackground,
                                      textStyle: FlutterFlowTheme.of(context)
                                          .bodySmall
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .bodySmallFamily,
                                            color: FlutterFlowTheme.of(context)
                                                .secondaryText,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.w500,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .bodySmallIsCustom,
                                          ),
                                      iconColor: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                      iconSize: 15.0,
                                      labelPadding: EdgeInsets.all(4.0),
                                      elevation: 1.0,
                                      borderRadius: BorderRadius.circular(12.0),
                                    ),
                                    chipSpacing: 12.0,
                                    rowSpacing: 12.0,
                                    multiselect: false,
                                    initialized:
                                        _model.choiceChipsWDValue != null,
                                    alignment: WrapAlignment.spaceEvenly,
                                    controller:
                                        _model.choiceChipsWDValueController ??=
                                            FormFieldController<List<String>>(
                                      ['In Season'],
                                    ),
                                    wrapped: true,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 0.0, 8.0, 8.0),
                        child: Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              borderRadius: BorderRadius.circular(8.0),
                              border: Border.all(
                                color:
                                    FlutterFlowTheme.of(context).primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 0.0, 4.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Column(
                                          mainAxisSize: MainAxisSize.max,
                                          children: [
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Column(
                                                  mainAxisSize:
                                                      MainAxisSize.max,
                                                  children: [
                                                    Container(
                                                      width: 158.0,
                                                      height: 80.0,
                                                      decoration: BoxDecoration(
                                                        color: FlutterFlowTheme
                                                                .of(context)
                                                            .primaryBackground,
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(12.0),
                                                        shape:
                                                            BoxShape.rectangle,
                                                        border: Border.all(
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .primaryBorder,
                                                          width: 1.0,
                                                        ),
                                                      ),
                                                      child:
                                                          FlutterFlowCountController(
                                                        decrementIconBuilder:
                                                            (enabled) => FaIcon(
                                                          FontAwesomeIcons
                                                              .minus,
                                                          color: enabled
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .primaryText
                                                              : Color(
                                                                  0xFFEEEEEE),
                                                          size: 40.0,
                                                        ),
                                                        incrementIconBuilder:
                                                            (enabled) => FaIcon(
                                                          FontAwesomeIcons.plus,
                                                          color: enabled
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .tertiary
                                                              : Color(
                                                                  0xFFEEEEEE),
                                                          size: 40.0,
                                                        ),
                                                        countBuilder: (count) =>
                                                            Text(
                                                          count.toString(),
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .titleLarge
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleLargeFamily,
                                                                fontSize: 28.0,
                                                                letterSpacing:
                                                                    10.0,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .titleLargeIsCustom,
                                                              ),
                                                        ),
                                                        count: _model
                                                            .correctCountValue ??= 0,
                                                        updateCount: (count) =>
                                                            safeSetState(() =>
                                                                _model.correctCountValue =
                                                                    count),
                                                        stepSize: 1,
                                                        minimum: 0,
                                                        maximum: () {
                                                          if (widget.ppClassRow
                                                                  ?.element ==
                                                              'Container') {
                                                            return 3;
                                                          } else if (widget
                                                                  .ppClassRow
                                                                  ?.element ==
                                                              'Buried') {
                                                            return 4;
                                                          } else if (widget
                                                                  .ppClassRow
                                                                  ?.element ==
                                                              'Interior') {
                                                            return 6;
                                                          } else if (widget
                                                                  .ppClassRow
                                                                  ?.element ==
                                                              'Exterior') {
                                                            return 4;
                                                          } else if (widget
                                                                  .ppClassRow
                                                                  ?.element ==
                                                              'Handler Discrimination') {
                                                            return 3;
                                                          } else {
                                                            return 3;
                                                          }
                                                        }(),
                                                        contentPadding:
                                                            EdgeInsets.all(8.0),
                                                      ),
                                                    ),
                                                    Padding(
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  0.0,
                                                                  4.0,
                                                                  0.0,
                                                                  0.0),
                                                      child: Text(
                                                        'Correct Calls',
                                                        textAlign:
                                                            TextAlign.center,
                                                        style:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMediumFamily,
                                                                  letterSpacing:
                                                                      0.0,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .normal,
                                                                  useGoogleFonts:
                                                                      !FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMediumIsCustom,
                                                                ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                Column(
                                                  mainAxisSize:
                                                      MainAxisSize.max,
                                                  children: [
                                                    Container(
                                                      width: 158.0,
                                                      height: 80.0,
                                                      decoration: BoxDecoration(
                                                        color: FlutterFlowTheme
                                                                .of(context)
                                                            .primaryBackground,
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(12.0),
                                                        shape:
                                                            BoxShape.rectangle,
                                                        border: Border.all(
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .primaryBorder,
                                                          width: 1.0,
                                                        ),
                                                      ),
                                                      child:
                                                          FlutterFlowCountController(
                                                        decrementIconBuilder:
                                                            (enabled) => FaIcon(
                                                          FontAwesomeIcons
                                                              .minus,
                                                          color: enabled
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .primaryText
                                                              : Color(
                                                                  0xFFEEEEEE),
                                                          size: 40.0,
                                                        ),
                                                        incrementIconBuilder:
                                                            (enabled) => FaIcon(
                                                          FontAwesomeIcons.plus,
                                                          color: enabled
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .alternate
                                                              : Color(
                                                                  0xFFEEEEEE),
                                                          size: 40.0,
                                                        ),
                                                        countBuilder: (count) =>
                                                            Text(
                                                          count.toString(),
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .titleLarge
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleLargeFamily,
                                                                fontSize: 28.0,
                                                                letterSpacing:
                                                                    10.0,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .titleLargeIsCustom,
                                                              ),
                                                        ),
                                                        count: _model
                                                            .incorrectCountValue ??= 0,
                                                        updateCount: (count) =>
                                                            safeSetState(() =>
                                                                _model.incorrectCountValue =
                                                                    count),
                                                        stepSize: 1,
                                                        minimum: 0,
                                                        contentPadding:
                                                            EdgeInsets.all(8.0),
                                                      ),
                                                    ),
                                                    Padding(
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  0.0,
                                                                  4.0,
                                                                  0.0,
                                                                  0.0),
                                                      child: Text(
                                                        'Incorrect Calls',
                                                        style:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMediumFamily,
                                                                  letterSpacing:
                                                                      0.0,
                                                                  useGoogleFonts:
                                                                      !FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMediumIsCustom,
                                                                ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ].divide(SizedBox(width: 36.0)),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 0.0, 8.0, 8.0),
                        child: Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              borderRadius: BorderRadius.circular(8.0),
                              border: Border.all(
                                color:
                                    FlutterFlowTheme.of(context).primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 0.0, 4.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        Column(
                                          mainAxisSize: MainAxisSize.max,
                                          children: [
                                            Row(
                                              mainAxisSize: MainAxisSize.max,
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Column(
                                                  mainAxisSize:
                                                      MainAxisSize.max,
                                                  children: [
                                                    Container(
                                                      width: 158.0,
                                                      height: 80.0,
                                                      decoration: BoxDecoration(
                                                        color: FlutterFlowTheme
                                                                .of(context)
                                                            .primaryBackground,
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(12.0),
                                                        shape:
                                                            BoxShape.rectangle,
                                                        border: Border.all(
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .primaryBorder,
                                                          width: 1.0,
                                                        ),
                                                      ),
                                                      child:
                                                          FlutterFlowCountController(
                                                        decrementIconBuilder:
                                                            (enabled) => FaIcon(
                                                          FontAwesomeIcons
                                                              .minus,
                                                          color: enabled
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .primaryText
                                                              : Color(
                                                                  0xFFEEEEEE),
                                                          size: 40.0,
                                                        ),
                                                        incrementIconBuilder:
                                                            (enabled) => FaIcon(
                                                          FontAwesomeIcons.plus,
                                                          color: enabled
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .alternate
                                                              : Color(
                                                                  0xFFEEEEEE),
                                                          size: 40.0,
                                                        ),
                                                        countBuilder: (count) =>
                                                            Text(
                                                          count.toString(),
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .titleLarge
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleLargeFamily,
                                                                fontSize: 28.0,
                                                                letterSpacing:
                                                                    10.0,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .titleLargeIsCustom,
                                                              ),
                                                        ),
                                                        count: _model
                                                            .faultHEValue ??= 0,
                                                        updateCount: (count) =>
                                                            safeSetState(() =>
                                                                _model.faultHEValue =
                                                                    count),
                                                        stepSize: 1,
                                                        minimum: 0,
                                                        contentPadding:
                                                            EdgeInsets.all(8.0),
                                                      ),
                                                    ),
                                                    Padding(
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  0.0,
                                                                  4.0,
                                                                  0.0,
                                                                  0.0),
                                                      child: Text(
                                                        'Faults',
                                                        style:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMediumFamily,
                                                                  letterSpacing:
                                                                      0.0,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .normal,
                                                                  useGoogleFonts:
                                                                      !FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMediumIsCustom,
                                                                ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                Column(
                                                  mainAxisSize:
                                                      MainAxisSize.max,
                                                  children: [
                                                    Container(
                                                      width: 158.0,
                                                      height: 80.0,
                                                      decoration: BoxDecoration(
                                                        color: FlutterFlowTheme
                                                                .of(context)
                                                            .primaryBackground,
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(12.0),
                                                        shape:
                                                            BoxShape.rectangle,
                                                        border: Border.all(
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .primaryBackground,
                                                        ),
                                                      ),
                                                      child:
                                                          FlutterFlowCountController(
                                                        decrementIconBuilder:
                                                            (enabled) => FaIcon(
                                                          FontAwesomeIcons
                                                              .minus,
                                                          color: enabled
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .primaryText
                                                              : FlutterFlowTheme
                                                                      .of(context)
                                                                  .accent1,
                                                          size: 40.0,
                                                        ),
                                                        incrementIconBuilder:
                                                            (enabled) => FaIcon(
                                                          FontAwesomeIcons.plus,
                                                          color: enabled
                                                              ? FlutterFlowTheme
                                                                      .of(
                                                                          context)
                                                                  .alternate
                                                              : FlutterFlowTheme
                                                                      .of(context)
                                                                  .accent1,
                                                          size: 40.0,
                                                        ),
                                                        countBuilder: (count) =>
                                                            Text(
                                                          count.toString(),
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .titleLarge
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleLargeFamily,
                                                                fontSize: 28.0,
                                                                letterSpacing:
                                                                    10.0,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .titleLargeIsCustom,
                                                              ),
                                                        ),
                                                        count: _model
                                                            .noFinishValue ??= 0,
                                                        updateCount: (count) =>
                                                            safeSetState(() =>
                                                                _model.noFinishValue =
                                                                    count),
                                                        stepSize: 1,
                                                        minimum: 0,
                                                        contentPadding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    12.0,
                                                                    0.0,
                                                                    12.0,
                                                                    0.0),
                                                      ),
                                                    ),
                                                    Padding(
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  0.0,
                                                                  4.0,
                                                                  0.0,
                                                                  0.0),
                                                      child: Text(
                                                        'Incorrect Finish',
                                                        style:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMediumFamily,
                                                                  letterSpacing:
                                                                      0.0,
                                                                  useGoogleFonts:
                                                                      !FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMediumIsCustom,
                                                                ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ].divide(SizedBox(width: 36.0)),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      Divider(
                        height: 1.0,
                        thickness: 1.0,
                        color: FlutterFlowTheme.of(context).lineColor,
                      ),
                      Padding(
                        padding: EdgeInsets.all(8.0),
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            FFButtonWidget(
                              onPressed: () async {
                                HapticFeedback.heavyImpact();
                                FFAppState().asStopButtonShown = false;
                                FFAppState().asArea1Error = false;
                                FFAppState().asArea2Error = false;
                                FFAppState().asArea3Error = false;
                                FFAppState().asResultError = false;
                                FFAppState().asNQError = false;
                                FFAppState().asEXError = false;
                                FFAppState().asWDError = false;
                                safeSetState(() {});
                                _model.timerSearchController.onStopTimer();
                                _model.timerMaxTimeController.onStopTimer();
                                await TblEntryQueueTable().update(
                                  data: {
                                    'in_ring': false,
                                  },
                                  matchingRows: (rows) => rows.eqOrNull(
                                    'id',
                                    widget.ppEntryRow?.id,
                                  ),
                                );

                                context.pushNamed(
                                  PEntryListTabsWidget.routeName,
                                  queryParameters: {
                                    'ppClassRow': serializeParam(
                                      widget.ppClassRow,
                                      ParamType.SupabaseRow,
                                    ),
                                    'ppTrialRow': serializeParam(
                                      widget.ppTrialRow,
                                      ParamType.SupabaseRow,
                                    ),
                                  }.withoutNulls,
                                  extra: <String, dynamic>{
                                    kTransitionInfoKey: TransitionInfo(
                                      hasTransition: true,
                                      transitionType:
                                          PageTransitionType.leftToRight,
                                    ),
                                  },
                                );
                              },
                              text: 'Cancel',
                              options: FFButtonOptions(
                                width: 140.0,
                                height: 40.0,
                                padding: EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 0.0, 0.0),
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
                                elevation: 2.0,
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).primary,
                                  width: 1.0,
                                ),
                                borderRadius: BorderRadius.circular(40.0),
                              ),
                            ),
                            Builder(
                              builder: (context) => FFButtonWidget(
                                onPressed: () async {
                                  HapticFeedback.heavyImpact();
                                  FFAppState().asNQError = false;
                                  FFAppState().asEXError = false;
                                  FFAppState().asWDError = false;
                                  FFAppState().asResultError = false;
                                  FFAppState().asArea1Error = false;
                                  FFAppState().asArea2Error = false;
                                  FFAppState().asArea3Error = false;
                                  safeSetState(() {});
                                  if (_model.choiceChipsAKCValue ==
                                      'Qualified') {
                                    if (functions.isStopwatchAreaValid(
                                        _model
                                            .textFieldArea1TextController.text,
                                        true,
                                        _model.choiceChipsAKCValue)) {
                                      if (functions.isStopwatchAreaValid(
                                          _model.textFieldArea2TextController
                                              .text,
                                          functions.useThisArea(
                                              2,
                                              widget.ppEntryRow?.element,
                                              widget.ppEntryRow?.level),
                                          _model.choiceChipsAKCValue)) {
                                        FFAppState().asArea1Value = _model
                                            .textFieldArea1TextController.text;
                                        FFAppState().asArea2Value = _model
                                            .textFieldArea2TextController.text;
                                        FFAppState().asFaultHE =
                                            _model.faultHEValue!;
                                        FFAppState().asArea1Error = false;
                                        FFAppState().asArea2Error = false;
                                        FFAppState().asArea3Error = false;
                                        FFAppState().asCorrectCount =
                                            _model.correctCountValue!;
                                        FFAppState().asIncorrectCount =
                                            _model.incorrectCountValue!;
                                        FFAppState().asNoFinish =
                                            _model.noFinishValue!;
                                        safeSetState(() {});
                                      } else {
                                        FFAppState().asArea1Value = _model
                                            .textFieldArea1TextController.text;
                                        FFAppState().asArea2Value = _model
                                            .textFieldArea2TextController.text;
                                        FFAppState().asFaultHE =
                                            _model.faultHEValue!;
                                        FFAppState().asArea1Error = false;
                                        FFAppState().asArea2Error = false;
                                        FFAppState().asArea3Error = false;
                                        FFAppState().asCorrectCount =
                                            _model.correctCountValue!;
                                        FFAppState().asIncorrectCount =
                                            _model.incorrectCountValue!;
                                        FFAppState().asNoFinish =
                                            _model.noFinishValue!;
                                        safeSetState(() {});
                                      }
                                    } else {
                                      FFAppState().asArea1Error = true;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else if (_model.choiceChipsAKCValue ==
                                      'Absent') {
                                  } else if (_model.choiceChipsAKCValue ==
                                      'Excused') {
                                    if (_model.choiceChipsEXValue != null &&
                                        _model.choiceChipsEXValue != '') {
                                      FFAppState().asEXError = false;
                                      safeSetState(() {});
                                      await showDialog(
                                        context: context,
                                        builder: (alertDialogContext) {
                                          return AlertDialog(
                                            title: Text(FFAppState()
                                                .asEXError
                                                .toString()),
                                            content: Text('Excused'),
                                            actions: [
                                              TextButton(
                                                onPressed: () => Navigator.pop(
                                                    alertDialogContext),
                                                child: Text('Ok'),
                                              ),
                                            ],
                                          );
                                        },
                                      );
                                    } else {
                                      FFAppState().asEXError = true;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else if (_model.choiceChipsAKCValue ==
                                      'WD') {
                                    if (_model.choiceChipsWDValue != null &&
                                        _model.choiceChipsWDValue != '') {
                                      FFAppState().asWDError = false;
                                      safeSetState(() {});
                                    } else {
                                      FFAppState().asWDError = true;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else {
                                    FFAppState().asResultError = true;
                                    safeSetState(() {});
                                    return;
                                  }

                                  _model.timerSearchController.onStopTimer();
                                  _model.timerMaxTimeController.onStopTimer();
                                  // Confirm Score Dialog
                                  await showDialog(
                                    context: context,
                                    builder: (dialogContext) {
                                      return Dialog(
                                        elevation: 0,
                                        insetPadding: EdgeInsets.zero,
                                        backgroundColor: Colors.transparent,
                                        alignment:
                                            AlignmentDirectional(0.0, 0.0)
                                                .resolve(
                                                    Directionality.of(context)),
                                        child: GestureDetector(
                                          onTap: () {
                                            FocusScope.of(dialogContext)
                                                .unfocus();
                                            FocusManager.instance.primaryFocus
                                                ?.unfocus();
                                          },
                                          child:
                                              CConfirmScoreAKCScentWorkNationalWidget(
                                            cpResult:
                                                _model.choiceChipsAKCValue!,
                                            cpFaults: _model.faultHEValue!,
                                            cpArmband: valueOrDefault<int>(
                                              widget.ppEntryRow?.armband,
                                              0,
                                            ),
                                            cpReason: valueOrDefault<String>(
                                              () {
                                                if (_model
                                                        .choiceChipsAKCValue ==
                                                    'EX') {
                                                  return _model
                                                      .choiceChipsEXValue;
                                                } else if (_model
                                                        .choiceChipsAKCValue ==
                                                    'Absent') {
                                                  return 'Absent';
                                                } else {
                                                  return '-';
                                                }
                                              }(),
                                              '-',
                                            ),
                                            cpCorrectCount:
                                                _model.correctCountValue!,
                                            cpIncorrectCount:
                                                _model.incorrectCountValue!,
                                            cpArea1: valueOrDefault<String>(
                                              _model
                                                  .textFieldArea1TextController
                                                  .text,
                                              '00:00.00',
                                            ),
                                            cpArea2: valueOrDefault<String>(
                                              _model
                                                  .textFieldArea2TextController
                                                  .text,
                                              '00:00.00',
                                            ),
                                            cpClassRow: widget.ppClassRow,
                                            cpTrialRow: widget.ppTrialRow,
                                            cpEntryRow: widget.ppEntryRow,
                                            cpNoFinish: _model.noFinishValue!,
                                          ),
                                        ),
                                      );
                                    },
                                  );
                                },
                                text: 'Save',
                                options: FFButtonOptions(
                                  width: 140.0,
                                  height: 40.0,
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 0.0, 0.0, 0.0),
                                  iconPadding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 0.0, 0.0, 0.0),
                                  color: FlutterFlowTheme.of(context)
                                      .backgroundComponents,
                                  textStyle: FlutterFlowTheme.of(context)
                                      .bodyLarge
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyLargeFamily,
                                        color: FlutterFlowTheme.of(context)
                                            .colorWhite,
                                        letterSpacing: 0.0,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyLargeIsCustom,
                                      ),
                                  elevation: 2.0,
                                  borderRadius: BorderRadius.circular(40.0),
                                ),
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
          ),
        ),
      ),
    );
  }
}
