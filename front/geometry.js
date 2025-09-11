const { mat3, mat4, vec3 } = glMatrix;

let SEngineSceneConstants = 
	{ View						: mat4.create()
	, Perspective				: mat4.create()
	, Screen					: mat4.create()
	, VP						: mat4.create()
	, VPS						: mat4.create()
	, CameraPosition			: vec3.create()
	, CameraAngle				: 0
	, CameraFront				: vec3.create()
	, Time						: 0
	, LightDirection			: vec3.create()
	, LightSpotPower			: 0
	, LightPosition				: vec3.create()
	, PaddingB					: 0
	};

const VOXEL_FACE_VERTICES =
    [ [[0, 1, 0], [1, 1, 0], [0, 1, 1], [1, 1, 1]]  // Top
    , [[1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 1, 1]]  // Front
    , [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]  // Right
    , [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]]  // Bottom
    , [[0, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 1]]  // Back
    , [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]]  // Left
    ];
const VOXEL_FACE_UV =
    [ [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
    , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
    , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
    , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
    , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
    , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
    ];
const VOXEL_FACE_NORMALS =
    [ [[0.0,  1.0, 0], [0,  1.0, 0], [0,  1, 0], [0,  1, 0]]
    , [[1.0,  0, 0], [1,  0, 0], [1,  0, 0], [1,  0, 0]]
    , [[0,  0, 1.0], [0,  0, 1.0], [0,  0, 1], [0,  0, 1]]
    , [[0, -1.0, 0], [0, -1.0, 0], [0, -1, 0], [0, -1, 0]]
    , [[-1.0, 0, 0], [-1.0, 0, 0], [-1, 0, 0], [-1, 0, 0]]
    , [[0,  0,-1.0], [0,  0,-1.0], [0,  0,-1], [0,  0,-1]]
    ];
const VOXEL_FACE_INDICES_16 =
    [ [4*3+0, 4*3+1, 4*3+2, 4*3+1, 4*3+3, 4*3+2] // Bottom
    , [4*4+0, 4*4+2, 4*4+1, 4*4+1, 4*4+2, 4*4+3] // Back
    , [4*5+0, 4*5+2, 4*5+1, 4*5+1, 4*5+2, 4*5+3] // Left
    , [4*0+0, 4*0+2, 4*0+1, 4*0+1, 4*0+2, 4*0+3] // Top
    , [4*1+0, 4*1+1, 4*1+2, 4*1+1, 4*1+3, 4*1+2] // Front
    , [4*2+0, 4*2+1, 4*2+2, 4*2+1, 4*2+3, 4*2+2] // Right
    ];

function geometryBuildBox		(geometry, params) {
	const	offsetPositions				= geometry.Positions		.length; geometry.Positions			.resize(offsetPositions			+ 24);
	const	offsetNormals				= geometry.Normals			.length; geometry.Normals			.resize(offsetNormals			+ 24);
	const	offsetTextureCoords			= geometry.TextureCoords	.length; geometry.TextureCoords		.resize(offsetTextureCoords		+ 24);
	const	offsetPositionIndices		= geometry.PositionIndices	.length; geometry.PositionIndices	.resize(offsetPositionIndices	+ 36);
	const	vertices					= [...VOXEL_FACE_VERTICES];
	for(uint32_t iVertex = offsetPositions; iVertex < geometry.Positions.size(); ++iVertex)
		geometry.Positions[iVertex]	= params.Orientation.RotateVector(vertices[iVertex].Scaled(params.HalfSizes * 2.0f) - params.Origin);

	//memcpy(&geometry.Positions		[0], ::gpk::VOXEL_FACE_VERTICES	, geometry.Positions		.byte_count());
	for(uint32_t iVertex = offsetPositions; iVertex < geometry.Normals.size(); ++iVertex)
		geometry.Normals[iVertex]	= params.Orientation.RotateVector(geometry.Normals[iVertex]);
	memcpy(&geometry.Normals		[offsetNormals		], ::gpk::VOXEL_FACE_NORMALS.begin(), ::gpk::VOXEL_FACE_NORMALS	.byte_count());
	memcpy(&geometry.TextureCoords	[offsetTextureCoords], ::gpk::VOXEL_FACE_UV.begin()		, ::gpk::VOXEL_FACE_UV		.byte_count());
	const			indices						= {::gpk::VOXEL_FACE_INDICES_16[0], 36};
	for(uint32_t iIndex = offsetPositionIndices; iIndex < geometry.PositionIndices.size(); ++iIndex) 
		geometry.PositionIndices[iIndex] = indices[iIndex];

	return 0;
}

const SHAPE_TYPE =
    { Custom    : 0
    , Rectangle : 1
    , Circle    : 2
    , Ring      : 3
    , Cube      : 4
    , Sphere    : 5
    , Cylinder  : 6
    , Torus     : 7
    };
function paramsBox() { 
	let	result =
        { Origin            : [.5, .5, .5]
		, HalfSizes         : [.5, .5, .5]
		, Orientation       : [0, 0, 0, 1]
        };
    return result;
}
function paramsSphere() { 
	let	result =
        { Origin            : {}
	    , CellCount         : [32, 32]
	    , Reverse           : false
	    , Circumference     : 1.0
	    , Radius            : .5
	    , Orientation       : [0, 0, 0, 1]
        };
    return result;
}
function paramsDisc() { 
	let	result =
        { Origin            : {}
	    , Slices            : 16
	    , Circumference     : 1.0
	    , Radius            : .5
	    , Orientation       : [0, 0, 0, 1]
        };
    return result;
}
function paramsCircle() {
    let             result = paramsDisc();
	result.Rreverse   = false;
    return result;
}
function paramsRingSide() { 
	let	result =
        { Origin            : {}
	    , Slices            : 16
	    , Reverse           : false
	    , Circumference     : 1.0
	    , Radius            : [.45, .5]
	    , Orientation       : [0, 0, 0, 1]
        };
    return result;
}
function paramsTube() { 
	let	result =
        { Origin            : []
		, CellCount         : [16, 1]
		, Reverse           : false
		, Circumference     : 1.0
		, RadiusYMin        : [.45, .5]
		, RadiusYMax        : [.45, .5]
		, Height            : 1
		, Orientation       : [0, 0, 0, 1]
        };
    return result;
}
function paramsCylinderWall() { 
	let	result =
        { Origin        : []
		, CellCount     : [16, 2]
		, Reverse       : false
		, Circumference : 1.0
		, Radius        : [.5, .5]
		, Height        : 1
		, Orientation   : [0, 0, 0, 1]
        };
    return result;
}
function paramsGrid() { 
	let	result =
        { Origin        : [.5, 0, .5]
        , CellCount     : [9, 9]
        , Reverse       : false
        , Outward       : false
        , Size          : [1, 1]
        , Orientation   : [0, 0, 0, 1]
        };
    return result;
}
function paramsHelix() { 
	let	result =
        { Origin        : [0, .5]
	    , CellCount     : [9, 9]
	    , Radius        : [.5, .5]	// TODO: Not workin
	    , Length        : 1
	    , Orientation   : [0, 0, 0, 1]
        };
    return result;
}

function getDefaultGeometryBuffers() {
	return { Positions			: []
		, Normals			: []
		, TextureCoords		: []
		, Colors			: []
		, PositionIndices	: []
		};
}
function geometryBuildGrid		(geometry, params) {
	const	vertexOffset				= geometry.Positions.length;
	const	vertexCount					= [params.CellCount[0] + 1, params.CellCount[1] + 1];
	const	cellUnits					= [1.0 / params.CellCount[0], 1.0 / params.CellCount[1]];		// -- Generate texture coordinates
	for(let offset = [0, 0]; offset[1] < vertexCount[1]; ++offset[1])
	for(offset[0] = 0; offset[0] < vertexCount[0]; ++offset[0]) {
		geometry.TextureCoords.push([offset[0], params.CellCount[1] - offset[1]].InPlaceScale(cellUnits)); });
	// -- Generate normals
	geometry.Normals.resize(geometry.Normals.length + vertexCount.Area(), params.Orientation.RotateVector([0, params.Reverse ? -1.0 : 1.0, 0]));	// The normals are all the same for grids
	const	scale						= params.Size.InPlaceScale(cellUnits);	// -- Generate positions
	for(let offset = [0, 0]; offset[1] < vertexCount[1]; ++offset[1])
		for(offset[0] = 0; offset[0] < vertexCount[0]; ++offset[0]) {
			const	position					= [offset[0] * scale[0], 0, offset[1] * scale[1]];
			geometry.Positions.push(params.Orientation.RotateVector(position - params.Origin));
		}
	return geometryBuildGridIndices(geometry.PositionIndices, vertexOffset, params.CellCount, params.Reverse, params.Outward); 
}
function geometryBuildSphere	(geometry, params) {
	const	vertexOffset				= geometry.Positions.length;
	const	vertexCount					= [params.CellCount[0] + 1, params.CellCount[1] + 1];
	const	cellUnits					= [1.0 / params.CellCount[0], 1.0 / params.CellCount[1]];
	// -- Generate texture coordinates
	for(let offset = [0, 0]; offset[1] < vertexCount[1]; ++offset[1])
		for(offset[0] = 0; offset[0] < vertexCount[0]; ++offset[0]) 
			geometry.TextureCoords.push([offset[0] * cellUnits[0], (params.CellCount[1] - offset[1]) * cellUnits[1]]);
	// -- Generate normals and positions
	const	reverseScale				= params.Reverse ? -1.0 : 1.0;
	const	sliceScale					= [math_2pi * cellUnits[0] * reverseScale * params.Circumference, math_pi * cellUnits[1]];
	const	sliceOffset					= 0; //::gpk::math_pi * (1.0 - params.Circumference) * .5;
	for(let y = 0; y < vertexCount[1]; ++y) {
		const	currentY					= sliceScale[1] * y;
		const	currentRadius				= sin(currentY);
		for(let x = 0; x < vertexCount[0]; ++x) {
			const	currentX					= sliceScale[0] * x + sliceOffset;
			const	coord 						= [currentRadius * cos(currentX), -cos(currentY), currentRadius * sin(currentX)];
			geometry.Normals	.push(params.Orientation.RotateVector((coord * reverseScale)));
			geometry.Positions	.push(params.Orientation.RotateVector((coord * params.Radius) - params.Origin));
		}
	}
	return geometryBuildGridIndices(geometry.PositionIndices, vertexOffset, params.CellCount, false, false); 
}
function geometryBuildCircleSide(geometry, params) {
	const	vertexOffset				= geometry.Positions.length;
	const	vertexCount					= params.Slices + 1;
	const	cellUnits					= 1.0 / params.Slices;
	const	reverseScale				= params.Reverse ? -1.0 : 1.0;
	const	sliceScale					= cellUnits * ::gpk::math_2pi * params.Circumference * reverseScale;
	const	sliceOffset					= 0; //::gpk::math_2pi * (1.0 - params.Circumference);

	// -- Generate positions and texture coordinates
	geometry.Positions		.push(params.Orientation.RotateVector(-params.Origin)));	// The first vertex is the center of the circle
	geometry.TextureCoords	.push(::gpk::n2f32{.5f, .5f}));					// The first vertex is the center of the circle
	for(let iVertex = 0; iVertex < vertexCount; ++iVertex) {
		double						angle						= sliceScale * iVertex + sliceOffset;
		geometry.Positions		.push(params.Orientation.RotateVector(::gpk::n3f64{params.Radius}.RotateY(angle) - params.Origin));
		geometry.TextureCoords	.push([0.5, 0.0].Rotate(angle) + [.5, .5]);
	}
	// -- Generate normals
	geometry.Normals.resize(geometry.Normals.length + vertexCount + 1, params.Orientation.RotateVector([0, 1, 0]));	// The normals are all the same for a circle
	for(let iSlice = 0, sliceCount = params.Slices + 1; iSlice < sliceCount; ++iSlice)
		geometry.PositionIndices.append([vertexOffset + 0, vertexOffset + iSlice + 1, vertexOffset + iSlice + 0]);
	return 0; 
}
function geometryBuildCylinderWall	(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsCylinderWall & params) {
	const	vertexOffset				= geometry.Positions.size();
	const	vertexCount					= params.CellCount + ::gpk::n2u16{1, 1};

	// -- Generate texture coordinates
	const	cellUnits					= [1.0 / params.CellCount[0], 1.0 / params.CellCount[1]];
	vertexCount.for_each([&geometry, &params, cellUnits](coord) { geometry.TextureCoords.push_back(::gpk::n2u32{coord.x, (uint32_t)params.CellCount.y - coord.y}.f3_t().InPlaceScale(cellUnits).f2_t()); });

	// -- Generate normals
	const	reverseScale				= params.Reverse ? -1.0 : 1.0;
	const	lengthScale					= cellUnits.y * params.Height;
	const ::gpk::n3f64			normalBase					= [params.Height, -(params.Radius.Max - params.Radius.Min)].Normalize() * reverseScale;
	const	sliceScale					= cellUnits.x * ::gpk::math_2pi * params.Circumference * reverseScale;
	const	sliceOffset					= 0; //::gpk::math_pi * (1.0 - params.Circumference) * .5;
	vertexCount.for_each([&geometry, &normalBase, sliceScale, sliceOffset, &params](::gpk::n2u16 & coord) { geometry.Normals.push_back(params.Orientation.RotateVector((::gpk::n3f64{normalBase}.RotateY(sliceScale * coord.x + sliceOffset)).f2_t())); });

	// -- Generate positions
	for(let y = 0; y < vertexCount.y; ++y) {
		const double				radius						= ::gpk::interpolate_linear(params.Radius.Min, params.Radius.Max, cellUnits.y * y);
		for(let x = 0; x < vertexCount.x; ++x)
			geometry.Positions.push_back(params.Orientation.RotateVector(::gpk::n3f64{radius, (double)y * lengthScale}.RotateY(sliceScale * x + sliceOffset).f2_t() - params.Origin));
	}
	return ::geometryBuildGridIndices(geometry.PositionIndices, vertexOffset, params.CellCount, false, false); 
}
//
function geometryBuildFigure0	(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsHelix & params) { //(::gpk::SGeometryQuads & geometry, uint32_t stacks, uint32_t slices, float radius, const ::gpk::n3f32 & gridCenter)	{
	let vertexOffset				= geometry.Positions.size();
	let vertexCount					= params.CellCount + ::gpk::n2u16{1, 1};

	// -- Generate texture coordinates
	let cellUnits					= {1.0 / params.CellCount.x, 1.0 / params.CellCount.y};
	geometry.TextureCoords	.reserve(vertexCount.Area());
	geometry.Positions		.reserve(vertexCount.Area());
	geometry.Normals		.reserve(vertexCount.Area());
	vertexCount.for_each([&geometry, &params, cellUnits](::gpk::n2u16 & coord) { geometry.TextureCoords.push_back(::gpk::n2u32{coord.x, (uint32_t)params.CellCount.y - coord.y}.f2_t().InPlaceScale(cellUnits).f2_t()); });

	//const double				lengthScale					= cellUnits.y * params.Length;
	const sliceScale					= ::gpk::n2f64{::gpk::math_2pi * cellUnits.x, ::gpk::math_pi * cellUnits.y};
	for(let y = 0; y < vertexCount.y; ++y) {
		const radius						= ::gpk::interpolate_linear(params.Radius.Min, params.Radius.Max, cellUnits.y * y);
		for(let x = 0; x < vertexCount.x; ++x) {
			let position					= {sin(sliceScale.y * y) * sin(sliceScale.x * x) * radius, sin(sliceScale.y * y) * sin(::gpk::math_pi * x / params.CellCount.x) * params.Length, cos(sliceScale.x * x) * radius};
			geometry.Positions.push_back(params.Orientation.RotateVector(position.f2_t() - params.Origin));
		}
	}
	const indexOffset				= geometry.PositionIndices.size();
	gpk_necs(::geometryBuildGridIndices(geometry.PositionIndices, vertexOffset, params.CellCount, false, false)); 
	for(let iVertexIndex = indexOffset; iVertexIndex < geometry.PositionIndices.size(); iVertexIndex += 3) {
		const ::gpk::n3f32	a	= geometry.Positions[geometry.PositionIndices[iVertexIndex + 0]];
		const ::gpk::n3f32	b	= geometry.Positions[geometry.PositionIndices[iVertexIndex + 1]];
		const ::gpk::n3f32	c	= geometry.Positions[geometry.PositionIndices[iVertexIndex + 2]];
		geometry.Normals.push_back(params.Orientation.RotateVector((a - b).Normalize().Cross((a - c).Normalize()).Normalize()));
	}
	return 0;
}
function geometryBuildHelixHalf	(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsHelix & params) {
	const	vertexOffset				= geometry.Positions.size();
	const	vertexCount					= params.CellCount + [1, 1];

	// -- Generate texture coordinates
	const	cellUnits					= {1.0 / params.CellCount.x, 1.0 / params.CellCount.y};
	geometry.TextureCoords	.reserve(vertexCount.Area());
	geometry.Positions		.reserve(vertexCount.Area());
	geometry.Normals		.reserve(vertexCount.Area());
	vertexCount.for_each([&geometry, &params, cellUnits](::gpk::n2u16 & coord) { geometry.TextureCoords.push_back(::gpk::n2u32{coord.x, (uint32_t)params.CellCount.y - coord.y}.f2_t().InPlaceScale(cellUnits).f2_t()); });

	//const double				lengthScale					= cellUnits.y * params.Length;
	const	sliceScale					= ::gpk::n2f64{::gpk::math_2pi * cellUnits.x, ::gpk::math_pi * cellUnits.y};
	for(let y = 0; y < vertexCount.y; ++y) {
		const radius						= ::gpk::interpolate_linear(params.Radius.Min, params.Radius.Max, cellUnits.y * y);
		for(let x = 0; x < vertexCount.x; ++x) {
			const	position					= {sin(sliceScale.y * y) * sin(sliceScale.x * x) * radius, sin(sliceScale.y * y) * cos(::gpk::math_pi * x / params.CellCount.x) * params.Length, cos(sliceScale.x * x) * radius};
			geometry.Positions.push_back(params.Orientation.RotateVector(position - params.Origin));
		}
	}

	const uint32_t				indexOffset				= geometry.PositionIndices.size();
	gpk_necs(::geometryBuildGridIndices(geometry.PositionIndices, vertexOffset, params.CellCount, false, false)); 
	for(let iVertexIndex = indexOffset; iVertexIndex < geometry.PositionIndices.size(); iVertexIndex += 3) {
		const ::gpk::n3f32	a	= geometry.Positions[geometry.PositionIndices[iVertexIndex + 0]];
		const ::gpk::n3f32	b	= geometry.Positions[geometry.PositionIndices[iVertexIndex + 1]];
		const ::gpk::n3f32	c	= geometry.Positions[geometry.PositionIndices[iVertexIndex + 2]];
		geometry.Normals.push_back(params.Orientation.RotateVector((a - b).Normalize().Cross((a - c).Normalize()).Normalize()));
	}
	return 0;
}
function geometryBuildHelix		(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsHelix & params)	{
	const	vertexOffset				= geometry.Positions.size();
	gpk_necs(gpk::geometryBuildHelixHalf(geometry, params));
	const	vertexCount					= geometry.Positions.size() - vertexOffset;
	gpk_necs(geometry.TextureCoords	.append({&geometry.TextureCoords[vertexOffset], vertexCount}));
	gpk_necs(geometry.Positions		.append({&geometry.Positions	[vertexOffset], vertexCount}));
	gpk_necs(geometry.Normals		.append({&geometry.Normals		[vertexOffset], vertexCount}));
	geometry.Positions	.for_each([](::gpk::n3f32 & coord){ coord.z *= -1; coord.y *= -1; }, vertexOffset);
	geometry.Normals	.for_each([](::gpk::n3f32 & coord){ coord.z *= -1; coord.y *= -1; }, vertexOffset);
	return 0;
}
function geometryBuildRingSide	(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsRingSide & params) {
	const				vertexOffset				= geometry.Positions.size();
	::gpk::SParamsGrid			paramsGrid					= {{}, {params.Slices, 1}, params.Reverse};
	gpk_necall(gpk::geometryBuildGrid(geometry, paramsGrid), "params.Slices: %i", params.Slices);
	const	vertexCount					= geometry.Positions.size() - vertexOffset;
	const double				sliceScale					= ::gpk::math_2pi * params.Circumference;
	geometry.Positions.enumerate([sliceScale, params, &geometry](const uint32_t & index, const ::gpk::n3f32 & position) {
			const double				weight						= position.x * sliceScale;
			const ::gpk::SSinCos		sinCos						= {sin(weight), -cos(weight)};
			const ::gpk::n3f64			relativePosOuter			= {sinCos.Sin * params.Radius.Max, 0, sinCos.Cos * params.Radius.Max};
			const ::gpk::n3f64			relativePosInner			= {sinCos.Sin * params.Radius.Min, 0, sinCos.Cos * params.Radius.Min};
			::gpk::n3f32				& posOuter					= geometry.Positions[index];
			::gpk::n3f32				& posInner					= geometry.Positions[index + params.Slices + 1];
			posInner				= params.Orientation.RotateVector((relativePosInner.f2_t() * -1.f) - params.Origin);
			posOuter				= params.Orientation.RotateVector((relativePosOuter.f2_t() * -1.f) - params.Origin);
		}, vertexOffset, vertexOffset + (vertexCount >> 1)
	);
	return 0;
}
function geometryBuildRingFlat	(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsRingSide & params) {
	gpk_necs(gpk::geometryBuildRingSide(geometry, params));
	::gpk::SParamsRingSide		paramsSide					= params;
	paramsSide.Reverse		= true;
	gpk_necs(gpk::geometryBuildRingSide(geometry, paramsSide));
	return 0;
}
function geometryBuildDisc(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsDisc & params) {
	::gpk::SParamsCircle		paramsSide					= params;
	gpk_necs(gpk::geometryBuildCircleSide(geometry, params));
	paramsSide.Reverse		= true;
	gpk_necs(gpk::geometryBuildCircleSide(geometry, paramsSide));
	return 0;
}
function geometryBuildRing		(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsTube & params) {
	::gpk::SParamsRingSide		paramsSide					= {};
	paramsSide.Origin		= params.Origin;
	paramsSide.Slices		= params.CellCount.x;
	paramsSide.Radius		= params.RadiusYMin;
	paramsSide.Reverse		= !params.Reverse;	// looking down
	paramsSide.Circumference= params.Circumference;
	paramsSide.Orientation	= params.Orientation;
	gpk_necs(gpk::geometryBuildRingSide(geometry, paramsSide));
	{
		::gpk::SParamsCylinderWall	paramsWall					= {};
		paramsWall.Origin		= params.Origin;
		paramsWall.CellCount	= params.CellCount;
		paramsWall.Radius		= {params.RadiusYMin.Max, params.RadiusYMax.Max};
		paramsWall.Circumference= params.Circumference;
		paramsWall.Height		= params.Height;
		paramsWall.Orientation	= params.Orientation;
		paramsWall.Reverse		= params.Reverse;
		gpk_necs(gpk::geometryBuildCylinderWall(geometry, paramsWall));
		////
		paramsWall.Radius		= {params.RadiusYMin.Min, params.RadiusYMax.Min};
		paramsWall.Reverse		= !paramsWall.Reverse;
		gpk_necs(gpk::geometryBuildCylinderWall(geometry, paramsWall));
	}
	//
	paramsSide.Origin.y		-= params.Height;
	paramsSide.Radius		= params.RadiusYMax;
	paramsSide.Reverse		= !paramsSide.Reverse;	// looking up
	gpk_necs(gpk::geometryBuildRingSide(geometry, paramsSide));
	return 0;
}
function geometryBuildCylinder		(::gpk::SGeometryBuffers & geometry, const ::gpk::SParamsCylinderWall & params) {
	::gpk::SParamsCircle		cap							= {};
	cap.Origin				= params.Origin;
	cap.Radius				= params.Radius.Min;
	cap.Reverse				= !params.Reverse;
	cap.Orientation			= params.Orientation;
	gpk_necs(gpk::geometryBuildCircleSide(geometry, cap));

	gpk_necs(gpk::geometryBuildCylinderWall(geometry, params));

	cap.Reverse				= !cap.Reverse;
	cap.Radius				= params.Radius.Max;
	cap.Origin.y			-= params.Height;
	gpk_necs(gpk::geometryBuildCircleSide(geometry, cap));
	return 0;
}