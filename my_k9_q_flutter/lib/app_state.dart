import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FFAppState extends ChangeNotifier {
  static FFAppState _instance = FFAppState._internal();

  factory FFAppState() {
    return _instance;
  }

  FFAppState._internal();

  static void reset() {
    _instance = FFAppState._internal();
  }

  Future initializePersistedState() async {
    prefs = await SharedPreferences.getInstance();
    _safeInit(() {
      _asOrg = prefs.getString('ff_asOrg') ?? _asOrg;
    });
    _safeInit(() {
      _asClubLogo = prefs.getString('ff_asClubLogo') ?? _asClubLogo;
    });
    _safeInit(() {
      _asDarkMode = prefs.getBool('ff_asDarkMode') ?? _asDarkMode;
    });
    _safeInit(() {
      _asFavorite =
          prefs.getStringList('ff_asFavorite')?.map(int.parse).toList() ??
              _asFavorite;
    });
    _safeInit(() {
      _asFavoriteClass =
          prefs.getStringList('ff_asFavoriteClass')?.map(int.parse).toList() ??
              _asFavoriteClass;
    });
  }

  void update(VoidCallback callback) {
    callback();
    notifyListeners();
  }

  late SharedPreferences prefs;

  String _asOrg = 'akc';
  String get asOrg => _asOrg;
  set asOrg(String value) {
    _asOrg = value;
    prefs.setString('ff_asOrg', value);
  }

  String _asClubName = '';
  String get asClubName => _asClubName;
  set asClubName(String value) {
    _asClubName = value;
  }

  String _asRole = '';
  String get asRole => _asRole;
  set asRole(String value) {
    _asRole = value;
  }

  String _asArea2Value = '';
  String get asArea2Value => _asArea2Value;
  set asArea2Value(String value) {
    _asArea2Value = value;
  }

  String _asArea3Value = '';
  String get asArea3Value => _asArea3Value;
  set asArea3Value(String value) {
    _asArea3Value = value;
  }

  int _asAreaCount = 0;
  int get asAreaCount => _asAreaCount;
  set asAreaCount(int value) {
    _asAreaCount = value;
  }

  int _asAreaActive = 0;
  int get asAreaActive => _asAreaActive;
  set asAreaActive(int value) {
    _asAreaActive = value;
  }

  bool _asIsAKC = true;
  bool get asIsAKC => _asIsAKC;
  set asIsAKC(bool value) {
    _asIsAKC = value;
  }

  String _asMobileAppLicKey = '';
  String get asMobileAppLicKey => _asMobileAppLicKey;
  set asMobileAppLicKey(String value) {
    _asMobileAppLicKey = value;
  }

  bool _asStopButtonShown = false;
  bool get asStopButtonShown => _asStopButtonShown;
  set asStopButtonShown(bool value) {
    _asStopButtonShown = value;
  }

  bool _asPauseButtonShown = false;
  bool get asPauseButtonShown => _asPauseButtonShown;
  set asPauseButtonShown(bool value) {
    _asPauseButtonShown = value;
  }

  bool _asArea1Error = false;
  bool get asArea1Error => _asArea1Error;
  set asArea1Error(bool value) {
    _asArea1Error = value;
  }

  bool _asArea2Error = false;
  bool get asArea2Error => _asArea2Error;
  set asArea2Error(bool value) {
    _asArea2Error = value;
  }

  bool _asArea3Error = false;
  bool get asArea3Error => _asArea3Error;
  set asArea3Error(bool value) {
    _asArea3Error = value;
  }

  bool _asResultError = false;
  bool get asResultError => _asResultError;
  set asResultError(bool value) {
    _asResultError = value;
  }

  bool _asReadOnly = false;
  bool get asReadOnly => _asReadOnly;
  set asReadOnly(bool value) {
    _asReadOnly = value;
  }

  bool _asNQError = false;
  bool get asNQError => _asNQError;
  set asNQError(bool value) {
    _asNQError = value;
  }

  bool _asEXError = false;
  bool get asEXError => _asEXError;
  set asEXError(bool value) {
    _asEXError = value;
  }

  bool _asWDError = false;
  bool get asWDError => _asWDError;
  set asWDError(bool value) {
    _asWDError = value;
  }

  bool _asDQError = false;
  bool get asDQError => _asDQError;
  set asDQError(bool value) {
    _asDQError = value;
  }

  String _asArea1Value = '';
  String get asArea1Value => _asArea1Value;
  set asArea1Value(String value) {
    _asArea1Value = value;
  }

  int _asFaultHE = 0;
  int get asFaultHE => _asFaultHE;
  set asFaultHE(int value) {
    _asFaultHE = value;
  }

  int _asCheckinStatus = 0;
  int get asCheckinStatus => _asCheckinStatus;
  set asCheckinStatus(int value) {
    _asCheckinStatus = value;
  }

  bool _asUnreadDot = false;
  bool get asUnreadDot => _asUnreadDot;
  set asUnreadDot(bool value) {
    _asUnreadDot = value;
  }

  String _asScore = '';
  String get asScore => _asScore;
  set asScore(String value) {
    _asScore = value;
  }

  String _asClubLogo = '';
  String get asClubLogo => _asClubLogo;
  set asClubLogo(String value) {
    _asClubLogo = value;
    prefs.setString('ff_asClubLogo', value);
  }

  bool _asScoreError = false;
  bool get asScoreError => _asScoreError;
  set asScoreError(bool value) {
    _asScoreError = value;
  }

  String _asAppVersionDB = '';
  String get asAppVersionDB => _asAppVersionDB;
  set asAppVersionDB(String value) {
    _asAppVersionDB = value;
  }

  bool _asDarkMode = false;
  bool get asDarkMode => _asDarkMode;
  set asDarkMode(bool value) {
    _asDarkMode = value;
    prefs.setBool('ff_asDarkMode', value);
  }

  List<int> _asFavorite = [];
  List<int> get asFavorite => _asFavorite;
  set asFavorite(List<int> value) {
    _asFavorite = value;
    prefs.setStringList(
        'ff_asFavorite', value.map((x) => x.toString()).toList());
  }

  void addToAsFavorite(int value) {
    asFavorite.add(value);
    prefs.setStringList(
        'ff_asFavorite', _asFavorite.map((x) => x.toString()).toList());
  }

  void removeFromAsFavorite(int value) {
    asFavorite.remove(value);
    prefs.setStringList(
        'ff_asFavorite', _asFavorite.map((x) => x.toString()).toList());
  }

  void removeAtIndexFromAsFavorite(int index) {
    asFavorite.removeAt(index);
    prefs.setStringList(
        'ff_asFavorite', _asFavorite.map((x) => x.toString()).toList());
  }

  void updateAsFavoriteAtIndex(
    int index,
    int Function(int) updateFn,
  ) {
    asFavorite[index] = updateFn(_asFavorite[index]);
    prefs.setStringList(
        'ff_asFavorite', _asFavorite.map((x) => x.toString()).toList());
  }

  void insertAtIndexInAsFavorite(int index, int value) {
    asFavorite.insert(index, value);
    prefs.setStringList(
        'ff_asFavorite', _asFavorite.map((x) => x.toString()).toList());
  }

  List<int> _asFavoriteClass = [];
  List<int> get asFavoriteClass => _asFavoriteClass;
  set asFavoriteClass(List<int> value) {
    _asFavoriteClass = value;
    prefs.setStringList(
        'ff_asFavoriteClass', value.map((x) => x.toString()).toList());
  }

  void addToAsFavoriteClass(int value) {
    asFavoriteClass.add(value);
    prefs.setStringList('ff_asFavoriteClass',
        _asFavoriteClass.map((x) => x.toString()).toList());
  }

  void removeFromAsFavoriteClass(int value) {
    asFavoriteClass.remove(value);
    prefs.setStringList('ff_asFavoriteClass',
        _asFavoriteClass.map((x) => x.toString()).toList());
  }

  void removeAtIndexFromAsFavoriteClass(int index) {
    asFavoriteClass.removeAt(index);
    prefs.setStringList('ff_asFavoriteClass',
        _asFavoriteClass.map((x) => x.toString()).toList());
  }

  void updateAsFavoriteClassAtIndex(
    int index,
    int Function(int) updateFn,
  ) {
    asFavoriteClass[index] = updateFn(_asFavoriteClass[index]);
    prefs.setStringList('ff_asFavoriteClass',
        _asFavoriteClass.map((x) => x.toString()).toList());
  }

  void insertAtIndexInAsFavoriteClass(int index, int value) {
    asFavoriteClass.insert(index, value);
    prefs.setStringList('ff_asFavoriteClass',
        _asFavoriteClass.map((x) => x.toString()).toList());
  }

  String _asActivePage = '';
  String get asActivePage => _asActivePage;
  set asActivePage(String value) {
    _asActivePage = value;
  }

  int _asCorrectCount = 0;
  int get asCorrectCount => _asCorrectCount;
  set asCorrectCount(int value) {
    _asCorrectCount = value;
  }

  int _asIncorrectCount = 0;
  int get asIncorrectCount => _asIncorrectCount;
  set asIncorrectCount(int value) {
    _asIncorrectCount = value;
  }

  String _asShowType = 'Regular';
  String get asShowType => _asShowType;
  set asShowType(String value) {
    _asShowType = value;
  }

  int _asNoFinish = 0;
  int get asNoFinish => _asNoFinish;
  set asNoFinish(int value) {
    _asNoFinish = value;
  }
}

void _safeInit(Function() initializeField) {
  try {
    initializeField();
  } catch (_) {}
}

Future _safeInitAsync(Function() initializeField) async {
  try {
    await initializeField();
  } catch (_) {}
}
