# V2 contract

Public index exports MEASUREMENTS, METHODS, REFERENCES, PHANTOM, types,
newAnthropometry, anthropometrySchema, calculateAnthropometry,
legacyProjection, selectedReferences, compareAnthropometry.

Measurement IDs: mass,height,sittingHeight,armSpan,triceps,subscapular,biceps,
iliacCrest,supraspinale,abdominal,thighSkinfold,calfSkinfold,armRelaxed,armFlexed,
forearm,chest,waist,abdomen,hip,thighMax,thighMid,calf,humerus,femur,wrist,bimalleolar.

Input: version:2; measurements:Record<MeasurementId,{readings:[number|null,
number|null,number|null],side:'D'|'E',exception:string}>; methods:string[];
instruments:Array<{name:string,resolution:number|null,unit:string}>;
conditions:string; collectionProtocol:string; manualEdition:string ('unknown');
notes:string; populationCategory:null|'asian'|'africanAmerican'|'whiteHispanic';
pregnant:boolean|null; activityFactor:number|null; activityJustification:string;
targets:{fatPercent:number|null,muscleBoneRatio:number|null,bmi:number|null,
muscleMethod:null|'martin1990'|'lee2000'|'kerrMuscle1988',
boneMethod:null|'martinBone1991'|'rocha1975'}.
No default principal selection. methods chooses publication, not calculation.

calculateAnthropometry(input,{date,birthDate,sex:'M'|'F'}) returns frozen snapshot:
version:2; engineVersion:string; catalogVersion:string; calculatedAt:string (date);
context; measurements:Record<MeasurementId,MeasurementQuality>; results:Result[];
phantom:Result[]; somatotype:{endomorphy:number|null,mesomorphy:number|null,
ectomorphy:number|null,x:number|null,y:number|null,classification:string|null,
status:Status,reason:string}; methodMeta:Method[]; references:Reference[].

MeasurementQuality: {id,label,unit,value:number|null,status:Status,reason:string,
readings:[number|null,number|null,number|null],side:'D'|'E',exception:string,
count:number,discrepancyPercent:number|null,requiresThird:boolean,
consolidation:'none'|'single'|'mean'|'median'}.
Status = 'available'|'missing'|'review'|'invalid'.
Result = {id,label,value:number|null,unit,status,reason,methodId,methodVersion,
referenceIds:string[],inputs:Record<string,number|string|boolean|null>,
selected:boolean,classification:string|null}.
Reference = {id:string,text:string,url:string|null}.

Invalid/missing values are null; review may include provisional numbers.
All 26 readings allowed to be absent. Schema accepts decimal commas and points,
rejects nonfinite and extra IDs, preserves nonpositive numbers for local errors.
Dates strictly YYYY-MM-DD; age elapsed UTC calendar days /365.2425.
Quality and applicability warnings propagate to downstream results.
No rounding internally. Models and references are snapshot-versioned.

Durnin-Rahaman at age 16 and Durnin-Womersley from 17 through 72 use biceps,
triceps, subscapular and ISAK iliac crest (the suprailiac site described by those
methods), followed by Siri. The result remains available without abdominal
skinfold or abdominal girth. Petroski and Jackson-Pollock remain unavailable:
never substitute their distinct suprailiac sites or map Kerr adipose to chemical fat.
Martin bone source verification pending; Lee protocol adaptation flagged review;
Phantom supplied table attribution pending; no claim of universal validation.
selectedReferences returns only references for selected finite results from
snapshot references. legacyProjection is for new V2 saves only, not historical
migration. Clearing missing values is intentional to avoid stale legacy caches.
No evaluator credentials in input. No report emission or persistence in engine.
