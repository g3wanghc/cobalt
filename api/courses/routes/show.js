import Course from '../model'
import co from 'co'

export default function get(req, res, next) {
  if (!req.params.id) {
    let err = new Error('Identifier must be specified.')
    err.status = 400
    return next(err)
  }

  co(function* (){
    try {
      var doc = yield Course.findOne({ id: req.params.id }, '-__v -_id -meeting_sections._id -meeting_sections.times._id').exec()
      if (!doc) {
        let err = new Error('A course with the specified identifier does not exist.')
        err.status = 400
        return next(err)
      }
      res.json(doc)
    } catch (e) {
      return next(e)
    }
  })
}
