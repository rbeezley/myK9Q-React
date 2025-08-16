import '/backend/supabase/supabase.dart';
import '/components/c_confirm_score_u_k_c_rally/c_confirm_score_u_k_c_rally_widget.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_timer.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'package:stop_watch_timer/stop_watch_timer.dart';
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:provider/provider.dart';
import 'p_scoresheet_u_k_c_rally_model.dart';
export 'p_scoresheet_u_k_c_rally_model.dart';

class PScoresheetUKCRallyWidget extends StatefulWidget {
  const PScoresheetUKCRallyWidget({
    super.key,
    required this.ppEntryRow,
    required this.ppClassRow,
    this.ppTrialRow,
  });

  final ViewEntryClassJoinSectionDistinctRow? ppEntryRow;
  final TblClassQueueRow? ppClassRow;
  final TblTrialQueueRow? ppTrialRow;

  static String routeName = 'p_ScoresheetUKCRally';
  static String routePath = '/pScoresheetUKCRally';

  @override
  State<PScoresheetUKCRallyWidget> createState() =>
      _PScoresheetUKCRallyWidgetState();
}

class _PScoresheetUKCRallyWidgetState extends State<PScoresheetUKCRallyWidget> {
  late PScoresheetUKCRallyModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PScoresheetUKCRallyModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_ScoresheetUKCRally';
      safeSetState(() {});
    });

    _model.textFieldRunTimeTextController ??= TextEditingController();
    _model.textFieldRunTimeFocusNode ??= FocusNode();

    _model.textFieldRunTimeMask = MaskTextInputFormatter(mask: '##:##.##');
    _model.textFieldScoreTextController ??= TextEditingController();
    _model.textFieldScoreFocusNode ??= FocusNode();

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
                color: FlutterFlowTheme.of(context).colorWhite,
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
                _model.timerRunController.onStopTimer();
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
                  PEntryListTabsSeperateSectionWidget.routeName,
                  queryParameters: {
                    'ppTrialRow': serializeParam(
                      widget.ppTrialRow,
                      ParamType.SupabaseRow,
                    ),
                    'ppClassRow': serializeParam(
                      widget.ppClassRow,
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
              'UKC Rally Scoresheet',
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
                                    mainAxisAlignment: MainAxisAlignment.start,
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
                              padding: EdgeInsets.all(8.0),
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
                                              initialTime:
                                                  _model.timerRunInitialTimeMs,
                                              getDisplayTime: (value) =>
                                                  StopWatchTimer.getDisplayTime(
                                                value,
                                                hours: false,
                                              ),
                                              controller:
                                                  _model.timerRunController,
                                              updateStateInterval:
                                                  Duration(milliseconds: 1000),
                                              onChanged: (value, displayTime,
                                                  shouldUpdate) {
                                                _model.timerRunMilliseconds =
                                                    value;
                                                _model.timerRunValue =
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
                                          ],
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
                                              _model.timerRunController
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
                                                  .fromSTEB(8.0, 2.0, 0.0, 0.0),
                                              iconPadding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 0.0, 0.0),
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
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .titleSmallIsCustom,
                                                      ),
                                              elevation: 2.0,
                                              borderSide: BorderSide(
                                                color: Colors.transparent,
                                                width: 1.0,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(40.0),
                                            ),
                                          ),
                                        ),
                                        Builder(
                                          builder: (context) {
                                            if (FFAppState()
                                                .asStopButtonShown) {
                                              return FFButtonWidget(
                                                onPressed: () async {
                                                  HapticFeedback.heavyImpact();
                                                  FFAppState()
                                                          .asStopButtonShown =
                                                      false;
                                                  FFAppState()
                                                          .asPauseButtonShown =
                                                      false;
                                                  safeSetState(() {});
                                                  _model.timerRunController
                                                      .onStopTimer();
                                                },
                                                text: 'Stop',
                                                icon: Icon(
                                                  Icons.stop_circle_rounded,
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
                                                      .alternate,
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
                                            } else {
                                              return FFButtonWidget(
                                                onPressed: () async {
                                                  _model.timerRunController
                                                      .onStartTimer();
                                                  FFAppState()
                                                      .asStopButtonShown = true;
                                                  FFAppState()
                                                          .asPauseButtonShown =
                                                      true;
                                                  safeSetState(() {});
                                                },
                                                text: 'Start',
                                                icon: Icon(
                                                  Icons
                                                      .play_circle_outline_outlined,
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
                                                      .tertiary400,
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
                                            onPressed: FFAppState()
                                                    .asStopButtonShown
                                                ? null
                                                : () async {
                                                    HapticFeedback
                                                        .heavyImpact();
                                                    FFAppState()
                                                            .asStopButtonShown =
                                                        false;
                                                    safeSetState(() {});
                                                    _model.timerRunController
                                                        .onResetTimer();
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
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .titleSmallIsCustom,
                                                      ),
                                              elevation: 2.0,
                                              borderSide: BorderSide(
                                                color: Colors.transparent,
                                                width: 1.0,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(40.0),
                                            ),
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
                                        FFButtonWidget(
                                          onPressed:
                                              (_model.textFieldRunTimeTextController
                                                              .text !=
                                                          '')
                                                  ? null
                                                  : () async {
                                                      HapticFeedback
                                                          .heavyImpact();
                                                      safeSetState(() {
                                                        _model.textFieldRunTimeTextController
                                                                ?.text =
                                                            _model
                                                                .timerRunValue;
                                                        _model
                                                            .textFieldRunTimeMask
                                                            .updateMask(
                                                          newValue:
                                                              TextEditingValue(
                                                            text: _model
                                                                .textFieldRunTimeTextController!
                                                                .text,
                                                          ),
                                                        );
                                                      });
                                                      FFAppState()
                                                              .asArea1Value =
                                                          _model
                                                              .timerRunMilliseconds
                                                              .toString();
                                                      FFAppState()
                                                          .update(() {});
                                                      _model.timerRunController
                                                          .onResetTimer();
                                                    },
                                          text: 'Time',
                                          options: FFButtonOptions(
                                            width: 72.0,
                                            height: 35.0,
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    0.0, 0.0, 0.0, 0.0),
                                            iconPadding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    0.0, 0.0, 0.0, 0.0),
                                            color: FlutterFlowTheme.of(context)
                                                .backgroundComponents,
                                            textStyle:
                                                FlutterFlowTheme.of(context)
                                                    .labelLarge
                                                    .override(
                                                      fontFamily:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .labelLargeFamily,
                                                      color:
                                                          FlutterFlowTheme.of(
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
                                                  .textFieldRunTimeTextController,
                                              focusNode: _model
                                                  .textFieldRunTimeFocusNode,
                                              onChanged: (_) =>
                                                  EasyDebounce.debounce(
                                                '_model.textFieldRunTimeTextController',
                                                Duration(milliseconds: 100),
                                                () async {
                                                  if (_model.textFieldRunTimeTextController
                                                              .text !=
                                                          '') {
                                                    FFAppState().asArea1Error =
                                                        false;
                                                    safeSetState(() {});
                                                  } else {
                                                    FFAppState().asArea1Error =
                                                        true;
                                                    safeSetState(() {});
                                                  }
                                                },
                                              ),
                                              autofocus: false,
                                              obscureText: false,
                                              decoration: InputDecoration(
                                                isDense: true,
                                                labelText:
                                                    'Run Time (MM:SS.HH)',
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
                                                hintText: 'Enter Run Time',
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
                                                            .textFieldRunTimeFocusNode
                                                            ?.hasFocus ??
                                                        false)
                                                    ? FlutterFlowTheme.of(
                                                            context)
                                                        .primaryBackground
                                                    : FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryBackground,
                                                prefixIcon: Icon(
                                                  Icons.timer_sharp,
                                                ),
                                                suffixIcon: _model
                                                        .textFieldRunTimeTextController!
                                                        .text
                                                        .isNotEmpty
                                                    ? InkWell(
                                                        onTap: () async {
                                                          _model
                                                              .textFieldRunTimeTextController
                                                              ?.clear();
                                                          if (_model.textFieldRunTimeTextController
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
                                                  .textFieldRunTimeTextControllerValidator
                                                  .asValidator(context),
                                              inputFormatters: [
                                                _model.textFieldRunTimeMask
                                              ],
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
                                color: FFAppState().asResultError
                                    ? FlutterFlowTheme.of(context).error
                                    : FlutterFlowTheme.of(context)
                                        .primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(8.0),
                              child: FlutterFlowChoiceChips(
                                options: [
                                  ChipData('Qualified'),
                                  ChipData('NQ'),
                                  ChipData('Absent'),
                                  ChipData('EX'),
                                  ChipData('DQ')
                                ],
                                onChanged: (val) async {
                                  safeSetState(() => _model
                                      .choiceChipsUKCValue = val?.firstOrNull);
                                  HapticFeedback.heavyImpact();
                                },
                                selectedChipStyle: ChipStyle(
                                  backgroundColor: FlutterFlowTheme.of(context)
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
                                        fontStyle: FlutterFlowTheme.of(context)
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
                                  backgroundColor: FlutterFlowTheme.of(context)
                                      .primaryBackground,
                                  textStyle: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
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
                                alignment: WrapAlignment.spaceEvenly,
                                controller:
                                    _model.choiceChipsUKCValueController ??=
                                        FormFieldController<List<String>>(
                                  [],
                                ),
                                wrapped: true,
                              ),
                            ),
                          ),
                        ),
                      ),
                      if (_model.choiceChipsUKCValue == 'NQ')
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              8.0, 8.0, 8.0, 0.0),
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
                                  color: FFAppState().asNQError
                                      ? FlutterFlowTheme.of(context).error
                                      : FlutterFlowTheme.of(context)
                                          .primaryBorder,
                                  width: 2.0,
                                ),
                              ),
                              child: Padding(
                                padding: EdgeInsets.all(8.0),
                                child: FlutterFlowChoiceChips(
                                  options: [
                                    ChipData('Improper Performance'),
                                    ChipData('Honor'),
                                    ChipData('Missed Sign'),
                                    ChipData('Total Points')
                                  ],
                                  onChanged: (val) async {
                                    safeSetState(() => _model
                                        .choiceChipsNQValue = val?.firstOrNull);
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
                                  chipSpacing: 12.0,
                                  rowSpacing: 12.0,
                                  multiselect: false,
                                  initialized:
                                      _model.choiceChipsNQValue != null,
                                  alignment: WrapAlignment.spaceEvenly,
                                  controller:
                                      _model.choiceChipsNQValueController ??=
                                          FormFieldController<List<String>>(
                                    ['Improper Performance'],
                                  ),
                                  wrapped: true,
                                ),
                              ),
                            ),
                          ),
                        ),
                      if (_model.choiceChipsUKCValue == 'EX')
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              8.0, 8.0, 8.0, 0.0),
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
                                      ChipData('Dog Eliminated in Area'),
                                      ChipData('Handler Request'),
                                      ChipData('Out of Control'),
                                      ChipData('Overly Stressed'),
                                      ChipData('Other')
                                    ],
                                    onChanged: (val) => safeSetState(() =>
                                        _model.choiceChipsEXValue =
                                            val?.firstOrNull),
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
                                          .bodyMedium
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .bodyMediumFamily,
                                            color: FlutterFlowTheme.of(context)
                                                .secondaryText,
                                            letterSpacing: 0.0,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .bodyMediumIsCustom,
                                          ),
                                      iconColor: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                      iconSize: 0.0,
                                      labelPadding:
                                          EdgeInsetsDirectional.fromSTEB(
                                              4.0, 0.0, 0.0, 0.0),
                                      elevation: 1.0,
                                      borderRadius: BorderRadius.circular(12.0),
                                    ),
                                    chipSpacing: 12.0,
                                    rowSpacing: 12.0,
                                    multiselect: false,
                                    initialized:
                                        _model.choiceChipsEXValue != null,
                                    alignment: WrapAlignment.spaceEvenly,
                                    controller:
                                        _model.choiceChipsEXValueController ??=
                                            FormFieldController<List<String>>(
                                      ['Dog Eliminated in Area'],
                                    ),
                                    wrapped: true,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      if (_model.choiceChipsUKCValue == 'DQ')
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              8.0, 8.0, 8.0, 0.0),
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
                                  color: FFAppState().asDQError
                                      ? FlutterFlowTheme.of(context).error
                                      : FlutterFlowTheme.of(context)
                                          .primaryBorder,
                                  width: 2.0,
                                ),
                              ),
                              child: Padding(
                                padding: EdgeInsets.all(8.0),
                                child: FlutterFlowChoiceChips(
                                  options: [
                                    ChipData('Bite or Attempted Bite'),
                                    ChipData('Other')
                                  ],
                                  onChanged: (val) async {
                                    safeSetState(() => _model
                                        .choiceChipsDQValue = val?.firstOrNull);
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
                                  chipSpacing: 12.0,
                                  rowSpacing: 12.0,
                                  multiselect: false,
                                  initialized:
                                      _model.choiceChipsDQValue != null,
                                  alignment: WrapAlignment.spaceEvenly,
                                  controller:
                                      _model.choiceChipsDQValueController ??=
                                          FormFieldController<List<String>>(
                                    ['Bite or Attempted Bite'],
                                  ),
                                  wrapped: true,
                                ),
                              ),
                            ),
                          ),
                        ),
                      Padding(
                        padding: EdgeInsets.all(8.0),
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
                                        Form(
                                          key: _model.formKey,
                                          autovalidateMode:
                                              AutovalidateMode.disabled,
                                          child: Container(
                                            width: 300.0,
                                            decoration: BoxDecoration(),
                                            child: Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(8.0, 0.0, 8.0, 0.0),
                                              child: TextFormField(
                                                controller: _model
                                                    .textFieldScoreTextController,
                                                focusNode: _model
                                                    .textFieldScoreFocusNode,
                                                onChanged: (_) =>
                                                    EasyDebounce.debounce(
                                                  '_model.textFieldScoreTextController',
                                                  Duration(milliseconds: 100),
                                                  () async {
                                                    if (_model.textFieldScoreTextController
                                                                .text !=
                                                            '') {
                                                      FFAppState()
                                                          .asScoreError = false;
                                                      safeSetState(() {});
                                                    } else {
                                                      FFAppState()
                                                          .asScoreError = true;
                                                      safeSetState(() {});
                                                    }
                                                  },
                                                ),
                                                autofocus: false,
                                                obscureText: false,
                                                decoration: InputDecoration(
                                                  isDense: true,
                                                  labelText: 'Score (###)',
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
                                                  hintText: 'Enter Score',
                                                  enabledBorder:
                                                      OutlineInputBorder(
                                                    borderSide: BorderSide(
                                                      color:
                                                          FFAppState()
                                                                  .asScoreError
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
                                                              .textFieldScoreFocusNode
                                                              ?.hasFocus ??
                                                          false)
                                                      ? FlutterFlowTheme.of(
                                                              context)
                                                          .primaryBackground
                                                      : FlutterFlowTheme.of(
                                                              context)
                                                          .secondaryBackground,
                                                  prefixIcon: Icon(
                                                    Icons.numbers_rounded,
                                                  ),
                                                  suffixIcon: _model
                                                          .textFieldScoreTextController!
                                                          .text
                                                          .isNotEmpty
                                                      ? InkWell(
                                                          onTap: () async {
                                                            _model
                                                                .textFieldScoreTextController
                                                                ?.clear();
                                                            if (_model.textFieldScoreTextController
                                                                        .text !=
                                                                    '') {
                                                              FFAppState()
                                                                      .asScoreError =
                                                                  false;
                                                              safeSetState(
                                                                  () {});
                                                            } else {
                                                              FFAppState()
                                                                      .asScoreError =
                                                                  true;
                                                              safeSetState(
                                                                  () {});
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
                                                    .textFieldScoreTextControllerValidator
                                                    .asValidator(context),
                                              ),
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
                                FFAppState().asResultError = false;
                                FFAppState().asNQError = false;
                                FFAppState().asEXError = false;
                                FFAppState().asDQError = false;
                                safeSetState(() {});
                                _model.timerRunController.onStopTimer();
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
                                  PEntryListTabsSeperateSectionWidget.routeName,
                                  queryParameters: {
                                    'ppTrialRow': serializeParam(
                                      widget.ppTrialRow,
                                      ParamType.SupabaseRow,
                                    ),
                                    'ppClassRow': serializeParam(
                                      widget.ppClassRow,
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
                                    .titleSmall
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .titleSmallFamily,
                                      color: FlutterFlowTheme.of(context)
                                          .primaryText,
                                      fontSize: 16.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.normal,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .titleSmallIsCustom,
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
                                  if (_model.choiceChipsUKCValue ==
                                      'Qualified') {
                                    if (_model.textFieldRunTimeTextController
                                                .text !=
                                            '') {
                                      FFAppState().asArea1Error = false;
                                      FFAppState().asArea1Value = _model
                                          .textFieldRunTimeTextController.text;
                                      FFAppState().asResultError = false;
                                      safeSetState(() {});
                                      if (_model.formKey.currentState == null ||
                                          !_model.formKey.currentState!
                                              .validate()) {
                                        return;
                                      }
                                      if (_model.textFieldScoreTextController
                                                  .text !=
                                              '') {
                                        FFAppState().asScore = _model
                                            .textFieldScoreTextController.text;
                                        FFAppState().asScoreError = false;
                                        safeSetState(() {});
                                      } else {
                                        FFAppState().asScoreError = true;
                                        safeSetState(() {});
                                        return;
                                      }
                                    } else {
                                      FFAppState().asArea1Error = true;
                                      FFAppState().asResultError = false;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else if (_model.choiceChipsUKCValue ==
                                      'NQ') {
                                    if (_model.choiceChipsNQValue != null &&
                                        _model.choiceChipsNQValue != '') {
                                      FFAppState().asNQError = false;
                                      safeSetState(() {});
                                    } else {
                                      FFAppState().asNQError = true;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else if (_model.choiceChipsUKCValue ==
                                      'Absent') {
                                  } else if (_model.choiceChipsUKCValue ==
                                      'EX') {
                                    if (_model.choiceChipsEXValue != null &&
                                        _model.choiceChipsEXValue != '') {
                                      FFAppState().asEXError = false;
                                      safeSetState(() {});
                                    } else {
                                      FFAppState().asEXError = true;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else if (_model.choiceChipsUKCValue ==
                                      'DQ') {
                                    if (_model.choiceChipsDQValue != null &&
                                        _model.choiceChipsDQValue != '') {
                                      FFAppState().asDQError = false;
                                      safeSetState(() {});
                                    } else {
                                      FFAppState().asDQError = true;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else {
                                    FFAppState().asResultError = true;
                                    safeSetState(() {});
                                    return;
                                  }

                                  _model.timerRunController.onStopTimer();
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
                                          child: CConfirmScoreUKCRallyWidget(
                                            cpResult:
                                                _model.choiceChipsUKCValue!,
                                            cpArea1: _model
                                                .textFieldRunTimeTextController
                                                .text,
                                            cpArmband:
                                                widget.ppEntryRow!.armband!,
                                            cpClassRow: widget.ppClassRow!,
                                            cpTrialRow: widget.ppTrialRow!,
                                            cpReason: () {
                                              if (_model.choiceChipsUKCValue ==
                                                  'NQ') {
                                                return _model
                                                    .choiceChipsNQValue!;
                                              } else if (_model
                                                      .choiceChipsUKCValue ==
                                                  'EX') {
                                                return _model
                                                    .choiceChipsEXValue!;
                                              } else if (_model
                                                      .choiceChipsUKCValue ==
                                                  'DQ') {
                                                return _model
                                                    .choiceChipsDQValue!;
                                              } else if (_model
                                                      .choiceChipsUKCValue ==
                                                  'Absent') {
                                                return 'Absent';
                                              } else {
                                                return '-';
                                              }
                                            }(),
                                            paramEntryID: widget.ppEntryRow!,
                                            cpScore: _model
                                                .textFieldScoreTextController
                                                .text,
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
                                      .titleMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .titleMediumFamily,
                                        color: FlutterFlowTheme.of(context)
                                            .colorWhite,
                                        fontSize: 16.0,
                                        letterSpacing: 0.0,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .titleMediumIsCustom,
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
