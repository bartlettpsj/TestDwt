/**
 * This is using WebPack
 */

const dwt = require('exports?Dynamsoft&OnWebTwainNotFoundOnMacCallback&EnumDWT_PixelType&EnumDWT_BorderStyle&EnumDWT_MessageType&EnumDWT_Cap&EnumDWT_CapType&EnumDWT_TransferMode&EnumDWT_FileFormat&EnumDWT_TIFFCompressionType&EnumDWT_InterpolationMethod&EnumDWT_ImageType&EnumDWT_PDFCompressionType&EnumDWT_ShowMode&EnumDWT_CapValueType&EnumDWT_UnitType&EnumDWT_DUPLEX&EnumDWT_CapLanguage&EnumDWT_CapSupportedSizes&EnumDWT_CapFeederAlignment&EnumDWT_CapFeederOrder&EnumDWT_CapPrinter&EnumDWT_CapPrinterMode&EnumDWT_CapBitdepthReduction&EnumDWT_CapBitOrder&EnumDWT_CapFilterType&EnumDWT_CapFlash&EnumDWT_CapFlipRotation&EnumDWT_CapImageFilter&EnumDWT_CapLightPath&EnumDWT_CapLightSource&EnumDWT_MagType&EnumDWT_CapNoiseFilter&EnumDWT_CapORientation&EnumDWT_CapOverscan&EnumDWT_CapPixelFlavor&EnumDWT_CapPlanarChunky&EnumDWT_DataSourceStatus&EnumDWT_FitWindowType&EnumDWT_UploadDataFormat&EnumDWT_MouseShape!dwt/dist/dynamsoft.webtwain.min');
var Dynamsoft = dwt.Dynamsoft;
console.log('WebPack version dwt is: ' + dwt);

// Mac
console.log('Using Mac license');
Dynamsoft.WebTwainEnv.ProductKey = 'f0068NQAAAFsEPs/Oq0S+AZ25UDlYYgvj4verY4ShlP2FS3hHBj/rskJTTrNHdZzJHGZgFXSoHYKXG9AhYLVcnCs9YOAdg2U=';
Dynamsoft.WebTwainEnv.Trial = false;

Dynamsoft.WebTwainEnv.AutoLoad = false;

Dynamsoft.WebTwainEnv.Containers = [{ContainerId:'dwtcontrolContainer',Width:830,Height:350}];
Dynamsoft.WebTwainEnv.Load();
Dynamsoft.WebTwainEnv.RegisterEvent('OnWebTwainReady', Dynamsoft_OnReady);  // Register OnWebTwainReady event. This event fires as soon as Dynamic Web TWAIN is initialized and ready to be used

var DWObject;

function Dynamsoft_OnReady() {
  console.log('Dynamsoft on ready');

  DWObject = Dynamsoft.WebTwainEnv.GetWebTwain('dwtcontrolContainer');    // Get the Dynamic Web TWAIN object that is embeded in the div with id 'dwtcontrolContainer'
  if (DWObject) {
    var count = DWObject.SourceCount;
    for (var i = 0; i < count; i++)
      document.getElementById("source").options.add(new Option(DWObject.GetSourceNameItems(i), i)); // Get Data Source names from Data Source Manager and put them in a drop-down box
  }
}
function AcquireImage() {
  if (DWObject) {
    var OnAcquireImageSuccess, OnAcquireImageFailure;
    OnAcquireImageSuccess = OnAcquireImageFailure = function (){
      DWObject.CloseSource();
    };

    DWObject.SelectSourceByIndex(document.getElementById("source").selectedIndex); //Use method SelectSourceByIndex to avoid the 'Select Source' dialog
    DWObject.OpenSource();
    DWObject.IfDisableSourceAfterAcquire = true;	// Scanner source will be disabled/closed automatically after the scan.
    DWObject.AcquireImage(OnAcquireImageSuccess, OnAcquireImageFailure);
  }
}

function showLoadDialog() {
  console.log('Loading image - ', DWObject);
  if (DWObject) {
    DWObject.IfShowFileDialog = true;

    DWObject.LoadImageEx("",
      dwt.EnumDWT_ImageType.IT_ALL,
      () => {     console.log('Load Image Zoom initial: ' + DWObject.Zoom); }, // Success
      (errorCode, errorString) => { console.log(errorCode); }); // Failure
  }
}

function uploadImage() {
  DWObject.HTTPUpload('localhost:3000/api/images?access_token=jXO0ygDP4VzWFznJxXT5qiPPLHknjGBt6R1wQbtBl8jVQ0lnqHjFN2J3XkKz5N1l',
    [0], // indices,
    dwt.EnumDWT_ImageType.IT_PDF,
    dwt.EnumDWT_UploadDataFormat.Binary,
    (httpResponse) => { console.log('Success'); },
    (errorCode, errorString) => { console.log('Failure', errorCode, errorString); }
  );

}

function unloadWebTwain() {
  console.log('Unloading WebTwain');
  if (DWObject) {
    Dynamsoft.WebTwainEnv.Unload();
    console.log('Unloaded completed.');
  }
}

function loadWebTwain() {
  console.log('Loading WebTwain');

  Dynamsoft.WebTwainEnv.Load();
  console.log('Load completed.');
}

module.exports.showLoadDialog = showLoadDialog;
module.exports.acquireImage = AcquireImage;
module.exports.unloadWebTwain = unloadWebTwain;
module.exports.loadWebTwain = loadWebTwain;
module.exports.uploadImage = uploadImage;

