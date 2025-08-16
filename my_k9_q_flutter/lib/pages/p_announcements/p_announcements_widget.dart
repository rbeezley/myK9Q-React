import '/backend/supabase/supabase.dart';
import '/components/c_annc_card/c_annc_card_widget.dart';
import '/components/c_annc_create/c_annc_create_widget.dart';
import '/components/c_empty_announcemnt_list/c_empty_announcemnt_list_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/actions/index.dart' as actions;
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'p_announcements_model.dart';
export 'p_announcements_model.dart';

class PAnnouncementsWidget extends StatefulWidget {
  const PAnnouncementsWidget({
    super.key,
    this.popBack,
  });

  final bool? popBack;

  static String routeName = 'p_Announcements';
  static String routePath = '/pAnnouncements';

  @override
  State<PAnnouncementsWidget> createState() => _PAnnouncementsWidgetState();
}

class _PAnnouncementsWidgetState extends State<PAnnouncementsWidget> {
  late PAnnouncementsModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PAnnouncementsModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asUnreadDot = false;
      FFAppState().asActivePage = 'p_Announcements';
      safeSetState(() {});
      await actions.unsubscribe(
        'tbl_announcements',
      );
      await actions.subscribe(
        'tbl_announcements',
        () async {
          safeSetState(() => _model.requestCompleter = null);
          await _model.waitForRequestCompleted();
        },
      );
    });

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
            title: Text(
              'Announcements',
              style: FlutterFlowTheme.of(context).headlineMedium.override(
                    fontFamily:
                        FlutterFlowTheme.of(context).headlineMediumFamily,
                    color: Colors.white,
                    fontSize: 22.0,
                    letterSpacing: 0.0,
                    useGoogleFonts:
                        !FlutterFlowTheme.of(context).headlineMediumIsCustom,
                  ),
            ),
            actions: [
              FlutterFlowIconButton(
                borderColor: Colors.transparent,
                borderRadius: 30.0,
                borderWidth: 1.0,
                buttonSize: 50.0,
                icon: Icon(
                  Icons.refresh_rounded,
                  color: FlutterFlowTheme.of(context).colorWhite,
                  size: 30.0,
                ),
                onPressed: () async {
                  HapticFeedback.heavyImpact();
                  safeSetState(() => _model.requestCompleter = null);
                  await _model.waitForRequestCompleted();
                },
              ),
            ],
            centerTitle: true,
            elevation: 2.0,
          ),
          body: SafeArea(
            top: true,
            child: Stack(
              children: [
                Align(
                  alignment: AlignmentDirectional(0.0, 0.0),
                  child: Container(
                    width: double.infinity,
                    height: double.infinity,
                    constraints: BoxConstraints(
                      maxWidth: 479.0,
                    ),
                    decoration: BoxDecoration(),
                    child: Padding(
                      padding: EdgeInsets.all(8.0),
                      child: SingleChildScrollView(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  8.0, 0.0, 8.0, 0.0),
                              child: Row(
                                mainAxisSize: MainAxisSize.max,
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Recent Announcements',
                                      style: FlutterFlowTheme.of(context)
                                          .headlineSmall
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .headlineSmallFamily,
                                            letterSpacing: 0.0,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .headlineSmallIsCustom,
                                          ),
                                    ),
                                  ),
                                  Builder(
                                    builder: (context) => FlutterFlowIconButton(
                                      borderRadius: 30.0,
                                      buttonSize: 40.0,
                                      icon: Icon(
                                        Icons.note_add,
                                        color: FlutterFlowTheme.of(context)
                                            .primaryText,
                                        size: 30.0,
                                      ),
                                      onPressed: () async {
                                        await showDialog(
                                          context: context,
                                          builder: (dialogContext) {
                                            return Dialog(
                                              elevation: 0,
                                              insetPadding: EdgeInsets.zero,
                                              backgroundColor:
                                                  Colors.transparent,
                                              alignment:
                                                  AlignmentDirectional(0.0, 0.0)
                                                      .resolve(
                                                          Directionality.of(
                                                              context)),
                                              child: GestureDetector(
                                                onTap: () {
                                                  FocusScope.of(dialogContext)
                                                      .unfocus();
                                                  FocusManager
                                                      .instance.primaryFocus
                                                      ?.unfocus();
                                                },
                                                child: CAnncCreateWidget(
                                                  cpAction: () async {},
                                                ),
                                              ),
                                            );
                                          },
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      8.0, 0.0, 0.0, 0.0),
                                  child: Text(
                                    'Listed newest to oldest',
                                    style: FlutterFlowTheme.of(context)
                                        .bodySmall
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .bodySmallFamily,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.normal,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .bodySmallIsCustom,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                            Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                FutureBuilder<List<TblAnnouncementsRow>>(
                                  future: (_model.requestCompleter ??=
                                          Completer<List<TblAnnouncementsRow>>()
                                            ..complete(TblAnnouncementsTable()
                                                .queryRows(
                                              queryFn: (q) => q
                                                  .eqOrNull(
                                                    'mobile_app_lic_key',
                                                    FFAppState()
                                                        .asMobileAppLicKey,
                                                  )
                                                  .order('timestamp'),
                                            )))
                                      .future,
                                  builder: (context, snapshot) {
                                    // Customize what your widget looks like when it's loading.
                                    if (!snapshot.hasData) {
                                      return Center(
                                        child: Image.asset(
                                          'assets/images/skeleton.png',
                                        ),
                                      );
                                    }
                                    List<TblAnnouncementsRow>
                                        listViewAnnouncementsTblAnnouncementsRowList =
                                        snapshot.data!;

                                    if (listViewAnnouncementsTblAnnouncementsRowList
                                        .isEmpty) {
                                      return CEmptyAnnouncemntListWidget();
                                    }

                                    return RefreshIndicator(
                                      onRefresh: () async {},
                                      child: ListView.separated(
                                        padding:
                                            EdgeInsets.symmetric(vertical: 8.0),
                                        primary: false,
                                        shrinkWrap: true,
                                        scrollDirection: Axis.vertical,
                                        itemCount:
                                            listViewAnnouncementsTblAnnouncementsRowList
                                                .length,
                                        separatorBuilder: (_, __) =>
                                            SizedBox(height: 8.0),
                                        itemBuilder: (context,
                                            listViewAnnouncementsIndex) {
                                          final listViewAnnouncementsTblAnnouncementsRow =
                                              listViewAnnouncementsTblAnnouncementsRowList[
                                                  listViewAnnouncementsIndex];
                                          return wrapWithModel(
                                            model:
                                                _model.cAnncCardModels.getModel(
                                              'ukAnncCard',
                                              listViewAnnouncementsIndex,
                                            ),
                                            updateCallback: () =>
                                                safeSetState(() {}),
                                            child: CAnncCardWidget(
                                              key: Key(
                                                'Key9p2_${'ukAnncCard'}',
                                              ),
                                              cpAnncRow:
                                                  listViewAnnouncementsTblAnnouncementsRow,
                                              cpCallback: () async {
                                                safeSetState(() => _model
                                                    .requestCompleter = null);
                                                await _model
                                                    .waitForRequestCompleted();
                                              },
                                            ),
                                          );
                                        },
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ].addToEnd(SizedBox(
                              height: MediaQuery.sizeOf(context).width <
                                      kBreakpointSmall
                                  ? 72.0
                                  : 16.0)),
                        ),
                      ),
                    ),
                  ),
                ),
                Align(
                  alignment: AlignmentDirectional(0.0, 1.0),
                  child: wrapWithModel(
                    model: _model.cNavigationBarModel,
                    updateCallback: () => safeSetState(() {}),
                    child: CNavigationBarWidget(
                      cpSelectedPageIndex: 2,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
