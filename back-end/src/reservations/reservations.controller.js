/**
 * List handler for reservation resources
 */
const service = require("./reservations.service");
const asyncBoundary = require("../errors/asyncBoundary");

const VALID_PROPERTIES = [
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people",
  "reservation_id",
];

function hasOnlyValidProperties(req, res, next) {
  const data = ({} = req.body);
  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  }
  next();
}

async function reservationExists(req, res, next) {
  const {reservation_id} = req.params;
  const reservation = await service.read(reservation_id);
  if(!reservation) {
    next({ status: 404, message: `${reservation_id} could not be found`});
  }
  res.locals.reservation = reservation;
  next();
}

function read(req, res) {
  res.json({data: res.locals.reservation})
}

async function list(req, res, next) {
  const date = req.query.date;
  if (!date) {
    return next();
  }
  const reservations = await service.list(date);
  const sortedReservations = reservations.sort((a, b) =>
    a.reservation_time > b.reservation_time ? 1 : -1
  );
  res.json({ data: sortedReservations });
}

async function create(req, res) {
  const newReservation = await service.create(req.body.data);
  res.status(201).json({newReservation});
}

module.exports = {
  list,
  read: [reservationExists, read],
  create: [hasOnlyValidProperties, asyncBoundary(create)],
};
