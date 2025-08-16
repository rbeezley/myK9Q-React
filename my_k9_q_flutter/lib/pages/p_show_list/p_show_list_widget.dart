import '/backend/supabase/supabase.dart';
import '/components/c_empty_entry_list_for_dog/c_empty_entry_list_for_dog_widget.dart';
import '/components/c_loading_entries/c_loading_entries_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/actions/index.dart' as actions;
import '/index.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:just_audio/just_audio.dart';
import 'package:provider/provider.dart';
import 'p_show_list_model.dart';
export 'p_show_list_model.dart';

class PShowListWidget extends StatefulWidget {
  const PShowListWidget({super.key});

  static String routeName = 'p_ShowList';
  static String routePath = '/ShowList';

  @override
  State<PShowListWidget> createState() => _PShowListWidgetState();
}

class _PShowListWidgetState extends State<PShowListWidget> {
  late PShowListModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PShowListModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_ShowList';
      safeSetState(() {});
      await actions.unsubscribe(
        'tbl_entry_queue',
      );
      await actions.unsubscribe(
        'tbl_announcements',
      );
      await Future.delayed(
        Duration(
          milliseconds: 1000,
        ),
      );
      await actions.subscribe(
        'tbl_entry_queue',
        () async {
          if (FFAppState().asOrg == 'UKC Obedience') {
            safeSetState(() => _model.requestCompleter = null);
            await _model.waitForRequestCompleted();
          }
        },
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
                if (Navigator.of(context).canPop()) {
                  context.pop();
                }
                context.pushNamed(
                  PHomeWidget.routeName,
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
              'Show List',
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
            elevation: 0.0,
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
                    decoration: BoxDecoration(
                      color: FlutterFlowTheme.of(context).primaryBackground,
                    ),
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                8.0, 0.0, 8.0, 0.0),
                            child: FutureBuilder<List<TblShowQueueRow>>(
                              future: (_model.requestCompleter ??= Completer<
                                      List<TblShowQueueRow>>()
                                    ..complete(TblShowQueueTable().queryRows(
                                      queryFn: (q) => q.order('startdate'),
                                    )))
                                  .future,
                              builder: (context, snapshot) {
                                // Customize what your widget looks like when it's loading.
                                if (!snapshot.hasData) {
                                  return Center(
                                    child: CLoadingEntriesWidget(),
                                  );
                                }
                                List<TblShowQueueRow>
                                    listViewShowsTblShowQueueRowList =
                                    snapshot.data!;

                                if (listViewShowsTblShowQueueRowList.isEmpty) {
                                  return CEmptyEntryListForDogWidget();
                                }

                                return RefreshIndicator(
                                  onRefresh: () async {
                                    safeSetState(
                                        () => _model.requestCompleter = null);
                                    await _model.waitForRequestCompleted();
                                  },
                                  child: ListView.separated(
                                    padding:
                                        EdgeInsets.symmetric(vertical: 4.0),
                                    primary: false,
                                    shrinkWrap: true,
                                    scrollDirection: Axis.vertical,
                                    itemCount:
                                        listViewShowsTblShowQueueRowList.length,
                                    separatorBuilder: (_, __) =>
                                        SizedBox(height: 4.0),
                                    itemBuilder: (context, listViewShowsIndex) {
                                      final listViewShowsTblShowQueueRow =
                                          listViewShowsTblShowQueueRowList[
                                              listViewShowsIndex];
                                      return InkWell(
                                        splashColor: Colors.transparent,
                                        focusColor: Colors.transparent,
                                        hoverColor: Colors.transparent,
                                        highlightColor: Colors.transparent,
                                        onTap: () async {
                                          HapticFeedback.heavyImpact();

                                          context.pushNamed(
                                            PShowDetailsWidget.routeName,
                                            queryParameters: {
                                              'ppShowRow': serializeParam(
                                                listViewShowsTblShowQueueRow,
                                                ParamType.SupabaseRow,
                                              ),
                                            }.withoutNulls,
                                          );
                                        },
                                        child: Material(
                                          color: Colors.transparent,
                                          elevation: 3.0,
                                          shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(12.0),
                                          ),
                                          child: Container(
                                            width: double.infinity,
                                            height: 72.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .secondaryBackground,
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Color(0x230E151B),
                                                  offset: Offset(
                                                    0.0,
                                                    2.0,
                                                  ),
                                                )
                                              ],
                                              borderRadius:
                                                  BorderRadius.circular(12.0),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Container(
                                                  width: 70.0,
                                                  decoration: BoxDecoration(
                                                    borderRadius:
                                                        BorderRadius.only(
                                                      bottomLeft:
                                                          Radius.circular(12.0),
                                                      bottomRight:
                                                          Radius.circular(0.0),
                                                      topLeft:
                                                          Radius.circular(12.0),
                                                      topRight:
                                                          Radius.circular(0.0),
                                                    ),
                                                    shape: BoxShape.rectangle,
                                                  ),
                                                  alignment:
                                                      AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Builder(
                                                    builder: (context) {
                                                      if ((listViewShowsTblShowQueueRow
                                                                  .org ==
                                                              'AKC Scent Work') &&
                                                          (listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  null ||
                                                              listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  '')) {
                                                        return ClipRRect(
                                                          borderRadius:
                                                              BorderRadius.only(
                                                            bottomLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            bottomRight:
                                                                Radius.circular(
                                                                    0.0),
                                                            topLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            topRight:
                                                                Radius.circular(
                                                                    0.0),
                                                          ),
                                                          child: Image.asset(
                                                            'assets/images/exterior1.jpg',
                                                            width:
                                                                double.infinity,
                                                            height: 100.0,
                                                            fit: BoxFit.cover,
                                                            alignment:
                                                                Alignment(
                                                                    0.0, 0.0),
                                                          ),
                                                        );
                                                      } else if ((listViewShowsTblShowQueueRow
                                                                  .org ==
                                                              'UKC Nosework') &&
                                                          (listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  null ||
                                                              listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  '')) {
                                                        return ClipRRect(
                                                          borderRadius:
                                                              BorderRadius.only(
                                                            bottomLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            bottomRight:
                                                                Radius.circular(
                                                                    0.0),
                                                            topLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            topRight:
                                                                Radius.circular(
                                                                    0.0),
                                                          ),
                                                          child: Image.asset(
                                                            'assets/images/Interior1.jpeg',
                                                            width:
                                                                double.infinity,
                                                            height: 100.0,
                                                            fit: BoxFit.cover,
                                                            alignment:
                                                                Alignment(
                                                                    0.0, 0.0),
                                                          ),
                                                        );
                                                      } else if ((listViewShowsTblShowQueueRow
                                                                  .org ==
                                                              'UKC Obedience') &&
                                                          (listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  null ||
                                                              listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  '')) {
                                                        return ClipRRect(
                                                          borderRadius:
                                                              BorderRadius.only(
                                                            bottomLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            bottomRight:
                                                                Radius.circular(
                                                                    0.0),
                                                            topLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            topRight:
                                                                Radius.circular(
                                                                    0.0),
                                                          ),
                                                          child: Image.asset(
                                                            'assets/images/tera_heeling.jpg',
                                                            width:
                                                                double.infinity,
                                                            height: 100.0,
                                                            fit: BoxFit.cover,
                                                            alignment:
                                                                Alignment(
                                                                    0.0, 0.0),
                                                          ),
                                                        );
                                                      } else if ((listViewShowsTblShowQueueRow
                                                                  .org ==
                                                              'ASCA Scent Detection') &&
                                                          (listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  null ||
                                                              listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  '')) {
                                                        return ClipRRect(
                                                          borderRadius:
                                                              BorderRadius.only(
                                                            bottomLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            bottomRight:
                                                                Radius.circular(
                                                                    0.0),
                                                            topLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            topRight:
                                                                Radius.circular(
                                                                    0.0),
                                                          ),
                                                          child: Image.asset(
                                                            'assets/images/vehicle3.jpg',
                                                            width:
                                                                double.infinity,
                                                            height: 100.0,
                                                            fit: BoxFit.cover,
                                                            alignment:
                                                                Alignment(
                                                                    0.0, 0.0),
                                                          ),
                                                        );
                                                      } else if ((listViewShowsTblShowQueueRow
                                                                  .org ==
                                                              'AKC FastCat') &&
                                                          (listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  null ||
                                                              listViewShowsTblShowQueueRow
                                                                      .logo ==
                                                                  '')) {
                                                        return ClipRRect(
                                                          borderRadius:
                                                              BorderRadius.only(
                                                            bottomLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            bottomRight:
                                                                Radius.circular(
                                                                    0.0),
                                                            topLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            topRight:
                                                                Radius.circular(
                                                                    0.0),
                                                          ),
                                                          child: Image.asset(
                                                            'assets/images/ziva3-crop.jpg',
                                                            width:
                                                                double.infinity,
                                                            height: 100.0,
                                                            fit: BoxFit.cover,
                                                            alignment:
                                                                Alignment(
                                                                    0.0, 0.0),
                                                          ),
                                                        );
                                                      } else {
                                                        return ClipRRect(
                                                          borderRadius:
                                                              BorderRadius.only(
                                                            bottomLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            bottomRight:
                                                                Radius.circular(
                                                                    0.0),
                                                            topLeft:
                                                                Radius.circular(
                                                                    12.0),
                                                            topRight:
                                                                Radius.circular(
                                                                    0.0),
                                                          ),
                                                          child: Image.network(
                                                            listViewShowsTblShowQueueRow
                                                                .logo!,
                                                            width: 300.0,
                                                            height: 200.0,
                                                            fit: BoxFit.cover,
                                                          ),
                                                        );
                                                      }
                                                    },
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Padding(
                                                    padding:
                                                        EdgeInsetsDirectional
                                                            .fromSTEB(8.0, 0.0,
                                                                0.0, 0.0),
                                                    child: Column(
                                                      mainAxisSize:
                                                          MainAxisSize.max,
                                                      mainAxisAlignment:
                                                          MainAxisAlignment
                                                              .center,
                                                      crossAxisAlignment:
                                                          CrossAxisAlignment
                                                              .start,
                                                      children: [
                                                        Padding(
                                                          padding:
                                                              EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      0.0,
                                                                      0.0,
                                                                      16.0,
                                                                      0.0),
                                                          child: Row(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .spaceBetween,
                                                            children: [
                                                              Text(
                                                                valueOrDefault<
                                                                    String>(
                                                                  listViewShowsTblShowQueueRow
                                                                      .clubname,
                                                                  'Club Name',
                                                                ).maybeHandleOverflow(
                                                                  maxChars: 45,
                                                                  replacement:
                                                                      '…',
                                                                ),
                                                                style: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .override(
                                                                      fontFamily:
                                                                          FlutterFlowTheme.of(context)
                                                                              .bodyMediumFamily,
                                                                      fontSize:
                                                                          14.0,
                                                                      letterSpacing:
                                                                          0.0,
                                                                      fontWeight:
                                                                          FontWeight
                                                                              .w500,
                                                                      useGoogleFonts:
                                                                          !FlutterFlowTheme.of(context)
                                                                              .bodyMediumIsCustom,
                                                                    ),
                                                              ),
                                                              Icon(
                                                                Icons
                                                                    .chevron_right,
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .secondaryText,
                                                                size: 20.0,
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        Padding(
                                                          padding:
                                                              EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      0.0,
                                                                      0.0,
                                                                      8.0,
                                                                      0.0),
                                                          child: Text(
                                                            '${dateTimeFormat(
                                                              "yMMMd",
                                                              listViewShowsTblShowQueueRow
                                                                  .startdate,
                                                              locale: FFLocalizations
                                                                      .of(context)
                                                                  .languageCode,
                                                            )} - ${dateTimeFormat(
                                                              "yMMMd",
                                                              listViewShowsTblShowQueueRow
                                                                  .enddate,
                                                              locale: FFLocalizations
                                                                      .of(context)
                                                                  .languageCode,
                                                            )}',
                                                            style: FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMediumFamily,
                                                                  fontSize:
                                                                      12.0,
                                                                  letterSpacing:
                                                                      0.0,
                                                                  useGoogleFonts:
                                                                      !FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMediumIsCustom,
                                                                ),
                                                          ),
                                                        ),
                                                        Padding(
                                                          padding:
                                                              EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      0.0,
                                                                      0.0,
                                                                      4.0,
                                                                      0.0),
                                                          child: Text(
                                                            valueOrDefault<
                                                                String>(
                                                              listViewShowsTblShowQueueRow
                                                                  .org,
                                                              'Org',
                                                            ),
                                                            style: FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMediumFamily,
                                                                  color: FlutterFlowTheme.of(
                                                                          context)
                                                                      .secondaryText,
                                                                  fontSize:
                                                                      12.0,
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
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                );
                              },
                            ),
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
                Align(
                  alignment: AlignmentDirectional(0.0, 1.0),
                  child: wrapWithModel(
                    model: _model.cNavigationBarModel,
                    updateCallback: () => safeSetState(() {}),
                    child: CNavigationBarWidget(
                      cpSelectedPageIndex: 3,
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
