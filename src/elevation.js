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
async function elevation(geojson, dem) {
  // Extract computing parameters
  const resolution = _.get(geojson, 'resolution', 30)
  console.log('[K2] elevation requested with parameters: ', { resolution })

   // prepare work folder
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'elevation-'))
  debug(`working directory: ${workDir}`)

  let feature
  if (geojson.type === 'FeatureCollection') feature = geojson.features[0]
  else feature = geojson

  // foreach segment, generate elevation profile as tiff
  // compute segment's length, generate as many point to match
  // requested resolution
  const allTasks = []
  turf_segmentEach(feature, (segment) => {
    const [ lon0, lat0 ] = segment.geometry.coordinates[0]
    const [ lon1, lat1 ] = segment.geometry.coordinates[1]
    const length = turf_length(segment, { units: 'kilometers' }) * 1000
    const numPoints = Math.floor(length / resolution)
    debug(`segment ${allTasks.length} ${numPoints} points with res ${resolution} (len=${length} m).`)

    const outFile = path.join(workDir, `segment_${allTasks.length}.tif`)
    const logFile = path.join(workDir, `segment_${allTasks.length}.log`)
    const projStr = `+proj=tpeqd +lon_1=${lon0} +lat_1=${lat0} +lon_2=${lon1} +lat_2=${lat1}`

    const task = {
      tif: outFile,
      segment,
      job: async () => {
        const cs2csOut = shell_scrap(`printf "${lat0} ${lon0}\\n${lat1} ${lon1}" | cs2cs EPSG:4326 +to ${projStr}`).split('\n').filter(e => e !== '')
        const minx = cs2csOut[0].split('\t')[0]
        const maxx = cs2csOut[1].split('\t')[0]

        return exec_bg('gdalwarp', [
                      '-te', minx, '-5', maxx, '5',
                      '-t_srs', `"${projStr}"`,
                      '-ts', numPoints, '1',
                      '-r', 'max',
                      dem, outFile ], logFile)
      },
      success: () => {},
      fail: () => {}
    }
    allTasks.push(task)
  })

  await parallel_exec(allTasks, 4)

  // we'll have to read each segment as tiff and generate a geojson points from data
  const segments = []
  for (const task of allTasks) {
    const tif = await GeoTIFF.fromFile(task.tif)
    const img = await tif.getImage()
    const res = img.getResolution()
    const data = await img.readRasters()
    // fill geojson point list
    segments.push(Array.from(data[0], (v, i) => {
      const point = turf_along(task.segment, i * res[0], { units: 'meters' })
      point.properties.z = v
      return point
    }))
  }

  fs.rmdirSync(workDir, { recursive: true })

  return turf_featureCollection([].concat(...segments))
}

exports.elevation = elevation
