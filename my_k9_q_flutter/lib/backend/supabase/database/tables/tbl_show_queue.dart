import '../database.dart';

class TblShowQueueTable extends SupabaseTable<TblShowQueueRow> {
  @override
  String get tableName => 'tbl_show_queue';

  @override
  TblShowQueueRow createRow(Map<String, dynamic> data) => TblShowQueueRow(data);
}

class TblShowQueueRow extends SupabaseDataRow {
  TblShowQueueRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblShowQueueTable();

  int get id => getField<int>('id')!;
  set id(int value) => setField<int>('id', value);

  DateTime get createdAt => getField<DateTime>('created_at')!;
  set createdAt(DateTime value) => setField<DateTime>('created_at', value);

  String? get mobileAppLicKey => getField<String>('mobile_app_lic_key');
  set mobileAppLicKey(String? value) =>
      setField<String>('mobile_app_lic_key', value);

  String? get appVersion => getField<String>('app_version');
  set appVersion(String? value) => setField<String>('app_version', value);

  String? get org => getField<String>('org');
  set org(String? value) => setField<String>('org', value);

  String? get clubname => getField<String>('clubname');
  set clubname(String? value) => setField<String>('clubname', value);

  int? get showid => getField<int>('showid');
  set showid(int? value) => setField<int>('showid', value);

  String? get showname => getField<String>('showname');
  set showname(String? value) => setField<String>('showname', value);

  DateTime? get startdate => getField<DateTime>('startdate');
  set startdate(DateTime? value) => setField<DateTime>('startdate', value);

  DateTime? get enddate => getField<DateTime>('enddate');
  set enddate(DateTime? value) => setField<DateTime>('enddate', value);

  String? get eventurl => getField<String>('eventurl');
  set eventurl(String? value) => setField<String>('eventurl', value);

  String? get website => getField<String>('website');
  set website(String? value) => setField<String>('website', value);

  String? get secretary => getField<String>('secretary');
  set secretary(String? value) => setField<String>('secretary', value);

  String? get chairman => getField<String>('chairman');
  set chairman(String? value) => setField<String>('chairman', value);

  String? get note => getField<String>('note');
  set note(String? value) => setField<String>('note', value);

  String? get siteaddress => getField<String>('siteaddress');
  set siteaddress(String? value) => setField<String>('siteaddress', value);

  String? get sitecity => getField<String>('sitecity');
  set sitecity(String? value) => setField<String>('sitecity', value);

  String? get sitestate => getField<String>('sitestate');
  set sitestate(String? value) => setField<String>('sitestate', value);

  String? get sitezip => getField<String>('sitezip');
  set sitezip(String? value) => setField<String>('sitezip', value);

  String? get logo => getField<String>('logo');
  set logo(String? value) => setField<String>('logo', value);

  String? get chairmanemail => getField<String>('chairmanemail');
  set chairmanemail(String? value) => setField<String>('chairmanemail', value);

  String? get chairmanphone => getField<String>('chairmanphone');
  set chairmanphone(String? value) => setField<String>('chairmanphone', value);

  String? get secretaryemail => getField<String>('secretaryemail');
  set secretaryemail(String? value) =>
      setField<String>('secretaryemail', value);

  String? get secretaryphone => getField<String>('secretaryphone');
  set secretaryphone(String? value) =>
      setField<String>('secretaryphone', value);

  String? get showtype => getField<String>('showtype');
  set showtype(String? value) => setField<String>('showtype', value);
}
