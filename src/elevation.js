const makeDebug = require('debug')
const child_process = require('child_process')
const os = require('os')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const turf_along = require('@turf/along').default
const turf_length = require('@turf/length').default
const { point: turf_point, lineString: turf_lineString, featureCollection: turf_featureCollection } = require('@turf/helpers')
const { segmentEach: turf_segmentEach } = require('@turf/meta')
const GeoTIFF = require('geotiff');

const debug = makeDebug('k2:elevation')

function shell_scrap(cl) {
  const opts = {
    stdio: 'pipe'
  }

  let stdout = null
  try {
    stdout = child_process.execSync(cl, opts)
  } catch(e) {
    console.error(e)
    process.exit(1)
  }

  return stdout ? stdout.toString() : ''
}

function exec_bg(exe, args, log_file, { cwd = null, env = null, exit_if_fails = true } = {}) {
  const opts = {
    cwd: cwd,
    stdio: 'inherit',
    env: env
  }
  const cl = `${exe} ${args.join(' ')} >> ${log_file} 2>&1`
  debug(`'${cl}' in '${opts.cwd}'`)
  return new Promise((resolve, reject) => {
    child_process.exec(cl, opts, (error, stdout, stderr) => {
      if (error !== null) {
        console.error(stderr)
        if (exit_if_fails) {
          process.exit(1)
        } else {
          reject()
        }
      }

      resolve()
    })
  })
}

async function parallel_exec(tasklist, concurrency) {
  const pending = Array.from({ length: concurrency }, (v, k) => null)
  const tickets = Array.from({ length: concurrency }, (v, k) => k)
  for (const task of tasklist) {
    const job = task.job()
    const index = tickets.pop()
    job.then(() => {
      // job done, make room for new job
      tickets.push(index)
      task.success()
    }).catch(() => {
      // job failed, make room for new job
      tickets.push(index)
      task.fail()
    })
    pending[index] = job
    if (tickets.length == 0) {
      try {
        await Promise.race(pending)
      } catch(err) {
        // some job failed, keep on
      }
    }
  }

  await Promise.all(pending)
}

// based on https://kokoalberti.com/articles/creating-elevation-profiles-with-gdal-and-two-point-equidistant-projection/
async function elevation(geojson) {
  // Extract computing parameters
  const resolution = _.get(geojson, 'resolution', 30)
  console.log('[K2] elevation requested with parameters: ', { resolution })
  const concurrency = _.get(geojson, 'concurrency', 4)
  const demOverride = _.get(geojson, 'demOverride', '')
  const corridorWidth = _.get(geojson, 'corridorWidth', 0)
  const halfCorridorWidth = Math.max(1, corridorWidth / 2)

  // 1 arc sec is ~30m at the equator (~ 0.0002778deg)
  // srtmv4 is 3arcsec => ~90m
  // gmted2010 has 7.5, 15 and 30 arcsec => ~250m, 500 & 1000m
  let demFile = demOverride
  if (demFile === '') {
    // no override, pick dem according to requested resolution
    if      (resolution <  250) demFile = 'srtm.vrt'
    else if (resolution <  500) demFile = 'GMTED2010/mx75.tif'
    else if (resolution < 1000) demFile = 'GMTED2010/mx15.tif'
    else                        demFile = 'GMTED2010/mx30.tif'
  }
  demFile = path.join('/mbtiles', demFile)

   // prepare work folder
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'elevation-'))

  debug(`using ${demFile} concurrency ${concurrency} corridor width ${corridorWidth}`)
  debug(`working directory ${workDir}`)

  let feature
  if (geojson.type === 'FeatureCollection') feature = geojson.features[0]
  else feature = geojson

  let totalDistance = 0
  let skipFirstPoint = false
  const allSegments = []
  turf_segmentEach(feature, (segment) => {
    const [ lon0, lat0 ] = segment.geometry.coordinates[0]
    const [ lon1, lat1 ] = segment.geometry.coordinates[1]
    const length = turf_length(segment, { units: 'kilometers' }) * 1000

    // how many points will we sample on this segment ?
    const t0 = (totalDistance / resolution) + (skipFirstPoint ? 1 : 0)
    const t1 = (totalDistance + length) / resolution
    const numPoints = 1 + Math.floor(t1) - Math.ceil(t0)

    debug(`segment ${allSegments.length} ${numPoints} points [${Math.ceil(t0)}, ${Math.floor(t1)}] [${t0}, ${t1}] start offset ${t0 - Math.trunc(t0)} `)

    // we'll have to skip first point on next segment
    // if the endpoint of this segment must be sampled
    skipFirstPoint = t1 === Math.floor(t1)

    // compute gdalwarp extent parameters
    // minx and maxx are in meters relative to 0 where 0 is the center of the segment
    let maxx = length / 2
    let minx = -maxx
    // adjust minx to fall on first sampled point of segment (might not be the first point)
    minx += resolution * (t0 - Math.trunc(t0))
    // adjust maxx to fall on last sampled point of segment (might not be the endpoint)
    maxx -= resolution * (t1 - Math.trunc(t1))
    // now adjust both by half the pixel size since we sample at pixel center
    minx -= resolution / 2
    maxx += resolution / 2

    debug(`segment ${allSegments.length} minx maxx [${-length/2}, ${length/2}] adjusted to [${minx}, ${maxx}] segment res ${(maxx - minx) / numPoints}`)

    allSegments.push({
      segment,
      numPoints,
      projStr: `+proj=tpeqd +lon_1=${lon0} +lat_1=${lat0} +lon_2=${lon1} +lat_2=${lat1}`,
      minx,
      maxx,
      offset: t0 - Math.trunc(t0)
    })

    totalDistance += length
  })

  if (!skipFirstPoint) {
    // extend last segment's maxx to sample past the endpoint
    allSegments[allSegments.length - 1].numPoints += 1
    allSegments[allSegments.length - 1].maxx += resolution
  }

  const allTasks = []
  allSegments.forEach((segment) => {
    if (segment.numPoints === 0) return

    const outFile = path.join(workDir, `task_${allTasks.length}.tif`)
    const logFile = path.join(workDir, `task_${allTasks.length}.log`)

    const task = {
      tif: outFile,
      segment: segment,
      job: async () => {
        return exec_bg('gdalwarp', [
          '-t_srs', `"${segment.projStr}"`,
          '-te', segment.minx, -halfCorridorWidth, segment.maxx, halfCorridorWidth,
          '-ts', segment.numPoints, '1',
          '-r', 'max',
          demFile, outFile ], logFile)
      },
      success: () => {},
      fail: () => {}
    }
    allTasks.push(task)
  })

  await parallel_exec(allTasks, concurrency)

  // we'll have to read each segment as tiff and generate a geojson points from data
  const segments = []
  for (const task of allTasks) {
    const tif = await GeoTIFF.fromFile(task.tif)
    const img = await tif.getImage()
    const res = img.getResolution()
    debug(`${task.tif} res [${res[0]}, ${res[1]}]`)
    const data = await img.readRasters()
    // fill geojson point list
    segments.push(Array.from(data[0], (v, i) => {
      const point = turf_along(task.segment.segment, (task.segment.offset + i) * res[0], { units: 'meters' })
      point.properties.z = v
      return point
    }))
  }

  fs.rmdirSync(workDir, { recursive: true })

  return turf_featureCollection([].concat(...segments))
}

exports.elevation = elevation
