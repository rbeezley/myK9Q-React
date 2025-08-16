import '/backend/api_requests/api_calls.dart';
import '/components/c_alert_dialog_new_version/c_alert_dialog_new_version_widget.dart';
import '/components/c_alert_dialog_warning/c_alert_dialog_warning_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/custom_code/actions/index.dart' as actions;
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'p_login_model.dart';
export 'p_login_model.dart';

class PLoginWidget extends StatefulWidget {
  const PLoginWidget({super.key});

  static String routeName = 'p_Login';
  static String routePath = '/pLogin';

  @override
  State<PLoginWidget> createState() => _PLoginWidgetState();
}

class _PLoginWidgetState extends State<PLoginWidget>
    with TickerProviderStateMixin {
  late PLoginModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final animationsMap = <String, AnimationInfo>{};

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PLoginModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_Login';
      safeSetState(() {});
      await actions.lockOrientation();
    });

    _model.pinCodeFocusNode ??= FocusNode();

    animationsMap.addAll({
      'imageOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          FadeEffect(
            curve: Curves.linear,
            delay: 270.0.ms,
            duration: 1000.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
          ScaleEffect(
            curve: Curves.linear,
            delay: 270.0.ms,
            duration: 1000.0.ms,
            begin: Offset(0.0, 0.0),
            end: Offset(1.0, 1.0),
          ),
        ],
      ),
    });
    setupAnimations(
      animationsMap.values.where((anim) =>
          anim.trigger == AnimationTrigger.onActionTrigger ||
          !anim.applyInitialState),
      this,
    );

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
          backgroundColor: FlutterFlowTheme.of(context).primary,
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
                  color: Color(0xFFEEEEEE),
                  image: DecorationImage(
                    fit: BoxFit.cover,
                    image: Image.asset(
                      'assets/images/wavesMiddle@3x.png',
                    ).image,
                  ),
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 24.0, 0.0, 0.0),
                        child: InkWell(
                          splashColor: Colors.transparent,
                          focusColor: Colors.transparent,
                          hoverColor: Colors.transparent,
                          highlightColor: Colors.transparent,
                          onTap: () async {
                            await launchURL('https://myk9t.com');
                          },
                          child: Image.asset(
                            'assets/images/myK9Q_LOGO-01-crop.jpg',
                            height: MediaQuery.sizeOf(context).height * 0.307,
                            fit: BoxFit.cover,
                          ),
                        ).animateOnPageLoad(
                            animationsMap['imageOnPageLoadAnimation']!),
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 16.0),
                        child: Text(
                          'v${FFAppConstants.conVersion}',
                          style: FlutterFlowTheme.of(context)
                              .bodyMedium
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .bodyMediumFamily,
                                color: FlutterFlowTheme.of(context).colorWhite,
                                fontSize: 12.0,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.normal,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .bodyMediumIsCustom,
                              ),
                        ),
                      ),
                      Text(
                        'Queue and Qualify',
                        textAlign: TextAlign.center,
                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyMediumFamily,
                              color: FlutterFlowTheme.of(context).colorWhite,
                              fontSize: 16.0,
                              letterSpacing: 0.0,
                              fontWeight: FontWeight.normal,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyMediumIsCustom,
                            ),
                      ),
                      Padding(
                        padding: EdgeInsetsDirectional.fromSTEB(
                            16.0, 32.0, 16.0, 16.0),
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            Text(
                              'Enter Pass Code provided by Host Club',
                              style: FlutterFlowTheme.of(context)
                                  .bodyMedium
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodyMediumFamily,
                                    color:
                                        FlutterFlowTheme.of(context).colorWhite,
                                    letterSpacing: 0.0,
                                    fontWeight: FontWeight.normal,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodyMediumIsCustom,
                                  ),
                            ),
                            FlutterFlowIconButton(
                              borderRadius: 20.0,
                              buttonSize: 40.0,
                              fillColor: FlutterFlowTheme.of(context)
                                  .backgroundComponents,
                              icon: Icon(
                                Icons.undo,
                                color: FlutterFlowTheme.of(context).colorWhite,
                                size: 28.0,
                              ),
                              onPressed: () async {
                                safeSetState(() {
                                  _model.pinCodeController?.clear();
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                      Builder(
                        builder: (context) => PinCodeTextField(
                          autoDisposeControllers: false,
                          appContext: context,
                          length: 5,
                          textStyle: FlutterFlowTheme.of(context)
                              .titleSmall
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .titleSmallFamily,
                                color: FlutterFlowTheme.of(context).colorWhite,
                                letterSpacing: 0.0,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .titleSmallIsCustom,
                              ),
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          enableActiveFill: false,
                          autoFocus: true,
                          focusNode: _model.pinCodeFocusNode,
                          enablePinAutofill: true,
                          errorTextSpace: 16.0,
                          showCursor: true,
                          cursorColor: FlutterFlowTheme.of(context).colorWhite,
                          obscureText: false,
                          hintCharacter: '●',
                          keyboardType: TextInputType.visiblePassword,
                          pinTheme: PinTheme(
                            fieldHeight: 50.0,
                            fieldWidth: 50.0,
                            borderWidth: 2.0,
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(12.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(12.0),
                            ),
                            shape: PinCodeFieldShape.box,
                            activeColor:
                                FlutterFlowTheme.of(context).colorWhite,
                            inactiveColor:
                                FlutterFlowTheme.of(context).colorWhite,
                            selectedColor:
                                FlutterFlowTheme.of(context).colorWhite,
                            activeFillColor: FlutterFlowTheme.of(context)
                                .backgroundComponents,
                            inactiveFillColor: FlutterFlowTheme.of(context)
                                .backgroundComponents,
                            selectedFillColor: FlutterFlowTheme.of(context)
                                .backgroundComponents,
                          ),
                          controller: _model.pinCodeController,
                          onChanged: (_) {},
                          onCompleted: (_) async {
                            var _shouldSetState = false;
                            _model.loginData = await GetAppLoginCall.call(
                              pincode: functions.parseAppLogin(
                                  _model.pinCodeController!.text),
                            );

                            _shouldSetState = true;
                            FFAppState().asAppVersionDB =
                                GetAppLoginCall.appversion(
                              (_model.loginData?.jsonBody ?? ''),
                            )!;
                            FFAppState().asShowType = valueOrDefault<String>(
                              GetAppLoginCall.showtype(
                                (_model.loginData?.jsonBody ?? ''),
                              ),
                              'Regular',
                            );
                            safeSetState(() {});
                            if (functions
                                .loginSuccess(GetAppLoginCall.mobileapplickey(
                              (_model.loginData?.jsonBody ?? ''),
                            ))) {
                              if (isAndroid) {
                                if (functions.verifyVersion(
                                    FFAppConstants.conVersion,
                                    GetAppLoginCall.appversion(
                                      (_model.loginData?.jsonBody ?? ''),
                                    )!)) {
                                  FFAppState().asOrg = GetAppLoginCall.org(
                                    (_model.loginData?.jsonBody ?? ''),
                                  )!;
                                  FFAppState().asClubName =
                                      GetAppLoginCall.clubname(
                                    (_model.loginData?.jsonBody ?? ''),
                                  )!;
                                  FFAppState().asMobileAppLicKey =
                                      GetAppLoginCall.mobileapplickey(
                                    (_model.loginData?.jsonBody ?? ''),
                                  )!;
                                  FFAppState().asRole = valueOrDefault<String>(
                                    functions.parseAppRole(
                                        _model.pinCodeController!.text),
                                    'e1234',
                                  );
                                  FFAppState().update(() {});

                                  context.pushNamed(PHomeWidget.routeName);

                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Mark your Dogs and Classes as a favorite to find them easily.',
                                        style: TextStyle(
                                          color: FlutterFlowTheme.of(context)
                                              .alternate,
                                          fontWeight: FontWeight.w500,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                      duration: Duration(milliseconds: 4000),
                                      backgroundColor:
                                          FlutterFlowTheme.of(context)
                                              .secondary,
                                    ),
                                  );
                                  if (_shouldSetState) safeSetState(() {});
                                  return;
                                } else {
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
                                          child: CAlertDialogNewVersionWidget(),
                                        ),
                                      );
                                    },
                                  );

                                  if (_shouldSetState) safeSetState(() {});
                                  return;
                                }
                              } else {
                                FFAppState().asOrg = GetAppLoginCall.org(
                                  (_model.loginData?.jsonBody ?? ''),
                                )!;
                                FFAppState().asClubName =
                                    GetAppLoginCall.clubname(
                                  (_model.loginData?.jsonBody ?? ''),
                                )!;
                                FFAppState().asMobileAppLicKey =
                                    GetAppLoginCall.mobileapplickey(
                                  (_model.loginData?.jsonBody ?? ''),
                                )!;
                                FFAppState().asRole = valueOrDefault<String>(
                                  functions.parseAppRole(
                                      _model.pinCodeController!.text),
                                  'e1234',
                                );
                                FFAppState().update(() {});

                                context.pushNamed(PHomeWidget.routeName);

                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Mark your Dogs and Classes as a favorite to find them easily.',
                                      style: TextStyle(
                                        color: FlutterFlowTheme.of(context)
                                            .alternate,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                    duration: Duration(milliseconds: 4000),
                                    backgroundColor:
                                        FlutterFlowTheme.of(context).secondary,
                                  ),
                                );
                                if (_shouldSetState) safeSetState(() {});
                                return;
                              }
                            } else {
                              await showDialog(
                                context: context,
                                builder: (dialogContext) {
                                  return Dialog(
                                    elevation: 0,
                                    insetPadding: EdgeInsets.zero,
                                    backgroundColor: Colors.transparent,
                                    alignment: AlignmentDirectional(0.0, 0.0)
                                        .resolve(Directionality.of(context)),
                                    child: GestureDetector(
                                      onTap: () {
                                        FocusScope.of(dialogContext).unfocus();
                                        FocusManager.instance.primaryFocus
                                            ?.unfocus();
                                      },
                                      child: CAlertDialogWarningWidget(
                                        cpAlertTitle: 'Pass Code Not Found',
                                        cpAlertMessage:
                                            'Pass Codes are not active until Trial has been uploaded. Verify code and try again.',
                                      ),
                                    ),
                                  );
                                },
                              );

                              if (_shouldSetState) safeSetState(() {});
                              return;
                            }

                            if (_shouldSetState) safeSetState(() {});
                          },
                          autovalidateMode: AutovalidateMode.onUserInteraction,
                          validator: _model.pinCodeControllerValidator
                              .asValidator(context),
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8.0),
                              ),
                              child: Padding(
                                padding: EdgeInsetsDirectional.fromSTEB(
                                    0.0, 16.0, 0.0, 16.0),
                                child: InkWell(
                                  splashColor: Colors.transparent,
                                  focusColor: Colors.transparent,
                                  hoverColor: Colors.transparent,
                                  highlightColor: Colors.transparent,
                                  onTap: () async {
                                    await launchURL('https://myk9t.com');
                                  },
                                  child: Text(
                                    'myK9Q allows exhibitors to check-in, indicate conflicts, view running order and preliminary results. \n\nEliminates manual data entry by the trial secretary.\n\nVisit www.myk9t.com for more information.\n\n** Requires reliable internet connectivity\n via Cellular data service or Wi-Fi.',
                                    textAlign: TextAlign.center,
                                    style: FlutterFlowTheme.of(context)
                                        .bodySmall
                                        .override(
                                          font: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w300,
                                            fontStyle: FontStyle.italic,
                                          ),
                                          color: FlutterFlowTheme.of(context)
                                              .gray200,
                                          fontSize: 12.0,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w300,
                                          fontStyle: FontStyle.italic,
                                        ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 16.0, 0.0, 0.0),
                        child: FFButtonWidget(
                          onPressed: () async {
                            HapticFeedback.heavyImpact();
                            await launchURL(
                                'https://myk9t.com/knowledge-base/myk9q/');
                          },
                          text: 'Help',
                          icon: Icon(
                            Icons.help_outline,
                            size: 24.0,
                          ),
                          options: FFButtonOptions(
                            height: 40.0,
                            padding: EdgeInsetsDirectional.fromSTEB(
                                24.0, 0.0, 24.0, 0.0),
                            iconPadding: EdgeInsetsDirectional.fromSTEB(
                                0.0, 0.0, 0.0, 0.0),
                            color: FlutterFlowTheme.of(context)
                                .backgroundComponents,
                            textStyle: FlutterFlowTheme.of(context)
                                .titleSmall
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .titleSmallFamily,
                                  color: Colors.white,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .titleSmallIsCustom,
                                ),
                            elevation: 3.0,
                            borderSide: BorderSide(
                              color: FlutterFlowTheme.of(context).colorWhite,
                              width: 1.0,
                            ),
                            borderRadius: BorderRadius.circular(8.0),
                          ),
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
