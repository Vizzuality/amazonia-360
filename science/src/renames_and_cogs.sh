set -exu

cd ../data/raw


gdal_translate -co COMPRESS=DEFLATE AFP\ GGHS_POP_E2025_R2023A\ WGS84.tif ../processed/population.tif
gdal_translate -of COG \
  -co TILING_SCHEME=GoogleMapsCompatible \
  -co ZOOM_LEVEL_STRATEGY=LOWER \
  -co RESAMPLING=sum  \
  -co COMPRESS=DEFLATE \
  -co BIGTIFF=YES \
  -co BLOCKSIZE=512 \
  -co ADD_ALPHA=NO \
  ../processed/population.tif ../processed/population_cog.tif

cp AFP_ALTCL250m.tif ../processed/elevation_ranges.tif
gdal_translate -of COG \
  -co TILING_SCHEME=GoogleMapsCompatible \
  -co ZOOM_LEVEL_STRATEGY=LOWER \
  -co RESAMPLING=mode  \
  -co COMPRESS=DEFLATE \
  -co BIGTIFF=YES \
  -co BLOCKSIZE=512 \
  -co ADD_ALPHA=NO \
  ../processed/elevation_ranges.tif ../processed/elevation_ranges_cog.tif

cp AFP_FORFIRES250m.tif ../processed/fires.tif
gdal_translate -of COG \
  -co TILING_SCHEME=GoogleMapsCompatible \
  -co ZOOM_LEVEL_STRATEGY=LOWER \
  -co RESAMPLING=mode  \
  -co COMPRESS=DEFLATE \
  -co BIGTIFF=YES \
  -co BLOCKSIZE=512 \
  -co ADD_ALPHA=NO \
  ../processed/../processed/fires.tif ../processed/../processed/fires_cog.tif


cp "AFP INDICE DEPRIVACION SEDAC WGS84.tif" ../processed/deprivation_index.tif
gdal_translate -of COG \
  -co TILING_SCHEME=GoogleMapsCompatible \
  -co ZOOM_LEVEL_STRATEGY=LOWER \
  -co RESAMPLING=average  \
  -co COMPRESS=DEFLATE \
  -co BIGTIFF=YES \
  -co BLOCKSIZE=512 \
  -co ADD_ALPHA=NO \
  ../processed/../processed/deprivation_index.tif ../processed/../processed/deprivation_index_cog.tif
