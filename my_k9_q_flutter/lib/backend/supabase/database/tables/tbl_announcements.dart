import '../database.dart';

class TblAnnouncementsTable extends SupabaseTable<TblAnnouncementsRow> {
  @override
  String get tableName => 'tbl_announcements';

  @override
  TblAnnouncementsRow createRow(Map<String, dynamic> data) =>
      TblAnnouncementsRow(data);
}

class TblAnnouncementsRow extends SupabaseDataRow {
  TblAnnouncementsRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblAnnouncementsTable();

  int get id => getField<int>('id')!;
  set id(int value) => setField<int>('id', value);

  DateTime? get createdAt => getField<DateTime>('created_at');
  set createdAt(DateTime? value) => setField<DateTime>('created_at', value);

  String? get mobileAppLicKey => getField<String>('mobile_app_lic_key');
  set mobileAppLicKey(String? value) =>
      setField<String>('mobile_app_lic_key', value);

  String get timestamp => getField<String>('timestamp')!;
  set timestamp(String value) => setField<String>('timestamp', value);

  String? get subject => getField<String>('subject');
  set subject(String? value) => setField<String>('subject', value);

  String? get body => getField<String>('body');
  set body(String? value) => setField<String>('body', value);
}
