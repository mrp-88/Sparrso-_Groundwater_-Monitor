// GRACE / GLDAS Groundwater Storage Monitoring — Bangladesh
// All 64 districts (FAO GAUL Admin Level 2)
// Author: Mashiyat Raunaq Preetom · SPARRSO / BUP
// Repository: github.com/raunaqpreetom88/GW-Monitor-Bangladesh

var gaul2 = ee.FeatureCollection("FAO/GAUL/2015/level2");
var bd = gaul2.filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));
Map.centerObject(bd, 7);

var startDate = '2003-01-01', endDate = '2025-12-31';
var baseStart = '2004-01-01', baseEnd = '2009-12-31';

// ─── Data ────────────────────────────────────────────────────
var grace = ee.ImageCollection("NASA/GRACE/MASS_GRIDS/MASCON_CRI")
  .select('lwe_thickness').filterDate(startDate, endDate);

var gldas = ee.ImageCollection("NASA/GLDAS/V021/NOAH/G025/T3H")
  .filterDate(startDate, endDate)
  .select(['SoilMoi0_10cm_inst','SoilMoi10_40cm_inst',
           'SoilMoi40_100cm_inst','SoilMoi100_200cm_inst',
           'SWE_inst','CanopInt_inst','Qs_acc','Qsb_acc']);

// ─── Monthly GLDAS composites (cm) ───────────────────────────
var months = ee.List.sequence(0,
  ee.Date(endDate).difference(ee.Date(startDate),'month').int());

var gldasMonthly = ee.ImageCollection(months.map(function(m){
  var d = ee.Date(startDate).advance(m,'month');
  var imgs = gldas.filterDate(d, d.advance(1,'month'));
  var sm = imgs.select(['SoilMoi0_10cm_inst','SoilMoi10_40cm_inst',
    'SoilMoi40_100cm_inst','SoilMoi100_200cm_inst'])
    .mean().reduce(ee.Reducer.sum()).divide(10).rename('SM');
  var swe = imgs.select('SWE_inst').mean().divide(10).rename('SWE');
  var can = imgs.select('CanopInt_inst').mean().divide(10).rename('CAN');
  var sw  = imgs.select(['Qs_acc','Qsb_acc']).mean()
    .reduce(ee.Reducer.sum()).divide(10).rename('SW');
  return sm.addBands(swe).addBands(can).addBands(sw)
    .set('system:time_start', d.millis());
}));

// ─── Baseline (2004–2009) ────────────────────────────────────
var baseTWS = grace.filterDate(baseStart,baseEnd).mean();
var baseSM  = gldasMonthly.filterDate(baseStart,baseEnd).select('SM').mean();
var baseSWE = gldasMonthly.filterDate(baseStart,baseEnd).select('SWE').mean();
var baseCAN = gldasMonthly.filterDate(baseStart,baseEnd).select('CAN').mean();
var baseSW  = gldasMonthly.filterDate(baseStart,baseEnd).select('SW').mean();

// ─── Water balance: ΔGWS = ΔTWS − ΔSM − ΔSWE − ΔCAN − ΔSW ────
var gwsCollection = grace.map(function(img){
  var d = img.date();
  var gl = gldasMonthly.filterDate(
    d.advance(-15,'day'), d.advance(15,'day')).first();
  var dTWS = img.subtract(baseTWS).rename('dTWS');
  var dSM  = gl.select('SM').subtract(baseSM).rename('dSM');
  var dSWE = gl.select('SWE').subtract(baseSWE).rename('dSWE');
  var dCAN = gl.select('CAN').subtract(baseCAN).rename('dCAN');
  var dSW  = gl.select('SW').subtract(baseSW).rename('dSW');
  var dGWS = dTWS.subtract(dSM).subtract(dSWE).subtract(dCAN).subtract(dSW).rename('dGWS');
  return dTWS.addBands(dSM).addBands(dSWE).addBands(dCAN).addBands(dSW).addBands(dGWS)
    .set('system:time_start', d.millis());
});

// ─── Sen's slope trend (annualised) ──────────────────────────
var gwsTrend = gwsCollection.select('dGWS')
  .reduce(ee.Reducer.sensSlope())
  .select('slope').multiply(12)
  .rename('GWS_trend_cm_yr');

// ─── Visualisation ───────────────────────────────────────────
Map.addLayer(gwsTrend.clip(bd),
  {min:-1.2, max:0.6,
   palette:['#8b0000','#d7191c','#fdae61','#ffffbf','#a6d96a','#1a9641','#00441b']},
  'GWS Sen\'s Slope (cm/yr)');

// ─── Per-district export ─────────────────────────────────────
var districtTrends = gwsTrend.reduceRegions({
  collection: bd, reducer: ee.Reducer.mean(), scale: 25000});

Export.table.toDrive({
  collection: districtTrends,
  description: 'BD_GWS_SensSlope_2003_2025',
  fileFormat: 'CSV'});