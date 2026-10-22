import cars from "../../json/car.json"
export async function GET() {
    return Response.json(cars)
}